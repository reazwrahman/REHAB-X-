/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import * as posenet from '@tensorflow-models/posenet';
import dat from 'dat.gui';
import Stats from 'stats.js';
import React from 'react'; //make this js into component

import {drawBoundingBox, drawKeypoints, drawSkeleton, isMobile} from './demo_util'; //  toggleLoadingUI,tryResNetButtonName, tryResNetButtonText, updateTryResNetButtonDatGuiCss --REMOVED

////////////////////////////// SQUAT import STUFF /////////////////////////////
import { useEffect, useState } from 'react';
//import * as posenet from '@tensorflow-models/posenet';
import similarity from 'compute-cosine-similarity';
import l2norm from 'compute-l2norm';
import VPTreeFactory from 'vptree';
import { sortBy, chain } from 'lodash';
//import { drawKeypoints, drawSkeleton } from './demo_util';

import { imagePaths, imageCategories } from '../dataset'; // originally '../dataset'

export const mediaSize = 500;       // videoHeight and videoWidth version of s-c (?) Used by VideoSelector
const imageScaleFactor = 0.5;       // multiplier: defaultMobileNetMultiplier (?)
const outputStride = 32;            // outputStride: defaultMobileNetStride = 16 (?)
const flipHorizontal = false;       // redifined in single and multipose with const flipPoseHorizontal = true;
const minPartConfidence = 0.1;      // minPartConfidence: 0.5 (?) from singlepose
const minConsecutivePoses = 10;     // ?????????????????????????????????????????

export async function loadPoseData() {    // WHY DO WE NEED THIS?
  const net = await posenet.load();
  const poseData = await buildPoseData(net, imagePaths);
  const vptree = await buildVPTree(poseData);
  return { net, vptree };
}


export function usePoseDetection(start, net, video, canvas) {
  const [pose, setPose] = useState(null);
  useEffect(
    () => {
      if (video) {
        const ctx = canvas.getContext('2d');

        detectPoseInRealTime(net, video, pose => {
          setPose(pose);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const { keypoints } = pose;
          drawKeypoints(keypoints, minPartConfidence, ctx);
          drawSkeleton(keypoints, minPartConfidence, ctx);
        });
      }
    },
    [video]
  );
  return pose;
}


export function useRepsCounter(pose, vptree) {
  const [counter] = useState([]);
  if (pose) {
    const match = findMostSimilarMatch(vptree, pose);
    incrementPoseCount(counter, match.category);
    const reps = countTotalReps(counter, 2);
    return reps;
  }
  return 0;
}

function cosineDistanceMatching(poseVector1, poseVector2) {
  let cosineSimilarity = similarity(poseVector1, poseVector2);
  let distance = 2 * (1 - cosineSimilarity);
  return Math.sqrt(distance);
}

// poseVector1 and poseVector2 are 52-float vectors composed of:
// Values 0-33: are x,y coordinates for 17 body parts in alphabetical order
// Values 34-51: are confidence values for each of the 17 body parts in alphabetical order
// Value 51: A sum of all the confidence values
// Again the lower the number, the closer the distance
function weightedDistanceMatching(poseVector1, poseVector2) {
  const partsEnd = parts.length * 2;
  const scoresEnd = partsEnd + parts.length;
  let vector1PoseXY = poseVector1.slice(0, partsEnd);
  let vector1Confidences = poseVector1.slice(partsEnd, scoresEnd);
  let vector1ConfidenceSum = poseVector1.slice(scoresEnd, scoresEnd + 1);

  let vector2PoseXY = poseVector2.slice(0, partsEnd);

  // First summation
  let summation1 = 1 / vector1ConfidenceSum;

  // Second summation
  let summation2 = 0;
  for (let i = 0; i < vector1PoseXY.length; i++) {
    let tempConf = Math.floor(i / 2);
    let tempSum =
      vector1Confidences[tempConf] *
      Math.abs(vector1PoseXY[i] - vector2PoseXY[i]);
    summation2 = summation2 + tempSum;
  }

  return summation1 * summation2;
}

async function buildVPTree(poseData) {
  // Initialize our vptree with our images’ pose data and a distance function
  return new Promise(resolve => {
    resolve(VPTreeFactory.build(poseData, weightedDistanceMatching));
  });
}

function findMostSimilarMatch(vptree, userPose) {
  const pose = convertPoseToVector(userPose);
  // search the vp tree for the image pose that is nearest (in cosine distance) to userPose
  let nearestImage = vptree.search(pose);

  // return index (in relation to poseData) of nearest match.
  return {
    index: nearestImage[0].i,
    score: nearestImage[0].d,
    category: imageCategories[nearestImage[0].i],
  };
}

async function buildPoseData(net, paths) {
  return await Promise.all(
    paths.map(async path => {
      const imagePose = await estimatePoseOnImage(net, path);
      return convertPoseToVector(imagePose);
    })
  );
}

async function loadImage(imagePath) {
  const image = new Image();
  const promise = new Promise((resolve, reject) => {
    image.crossOrigin = '';
    image.onload = () => {
      resolve(image);
    };
  });

  image.src = imagePath;
  return promise;
}

const parts = [
  'nose',
  // 'leftEye',
  // 'rightEye',
  // 'leftEar',
  // 'rightEar',

  'leftShoulder',
  'rightShoulder',

  'leftElbow',
  'rightElbow',
  'leftWrist',
  'rightWrist',

  'leftHip',
  'rightHip',
  'leftKnee',
  'rightKnee',
  'leftAnkle',
  'rightAnkle',
];
function convertPoseToVector(pose) {
  const keypoints = sortBy(normalizeKeypoints(pose), 'part');
  const vector = keypoints.reduce((acc, keypoint) => {
    if (parts.includes(keypoint.part)) {
      acc.push(keypoint.normalizedPosition.x);
      acc.push(keypoint.normalizedPosition.y);
    }
    return acc;
  }, []);

  const scoreSum = keypoints.reduce((acc, keypoint) => {
    vector.push(keypoint.score);
    return acc + keypoint.score;
  }, 0);

  vector.push(scoreSum);
  return l2normPoseVector(vector);
}

function normalizeKeypoints(pose) {
  const boundingBox = posenet.getBoundingBox(pose.keypoints);

  const normalizedPoints = pose.keypoints.map(keypoint => {
    return {
      ...keypoint,
      normalizedPosition: {
        x: keypoint.position.x - boundingBox.minX,
        y: keypoint.position.y - boundingBox.minY,
      },
    };
  });
  return normalizedPoints;
}

function l2normPoseVector(vector) {
  const norm = l2norm(vector);
  const normalized = vector.map(value => (value / norm) * (value / norm));
  // console.log(normalized.reduce((acc, value) => acc + value, 0))
  return normalized;
}

async function estimatePoseOnImage(net, imagePath) {
  // load the posenet model from a checkpoint
  const imageElement = await loadImage(imagePath);
  imageElement.width = mediaSize;
  imageElement.height = mediaSize;

  const pose = await net.estimateSinglePose(
    imageElement,
    imageScaleFactor,
    flipHorizontal,
    outputStride
  );

  console.log(pose);
  return pose;
}

function detectPoseInRealTime(net, video, onPose) {
  // video.playbackRate = 0.3;

  async function poseDetectionFrame() {
    const pose = await net.estimateSinglePose(
      video,
      imageScaleFactor,
      flipHorizontal,
      outputStride
    );

    onPose(pose);

    if (!video.paused) {
      requestAnimationFrame(poseDetectionFrame);
    }
  }

  poseDetectionFrame();
}


function incrementPoseCount(counter, category) {
  if (counter.length === 0) {
    counter.push([category, 1]);
  } else if (counter[counter.length - 1][0] === category) {
    counter[counter.length - 1][1]++;
  } else {
    counter.push([category, 1]);
  }
}

function countTotalReps(counter, numCategories) {
  const reps = chain(counter)
    .filter(p => p[1] >= minConsecutivePoses)
    .reduce((acc, pose) => {
      if (acc.length === 0) {
        acc.push(pose);
      } else {
        const previousPose = acc[acc.length - 1];
        if (previousPose[0] === pose[0]) {
          previousPose[1] += pose[1];
        } else {
          acc.push(pose);
        }
      }
      return acc;
    }, [])
    .value();

  return Math.max(0, Math.floor((reps.length - 1) / numCategories));
}

///////////////////////////////// SQUAT END ///////////////////////////////////

const videoWidth = 600;
const videoHeight = 500;
const stats = new Stats();


/**
 * Loads a the camera to be used in the demo
 *
 */

// A version of this is wrapped up in a class by React in Video.js
async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available');
  }
      // these 3 lines are different in Video.js because its jsx in React
  const video = document.getElementById('video');
  video.width = videoWidth;
  video.height = videoHeight;

  const mobile = isMobile();
  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      width: mobile ? undefined : videoWidth,
      height: mobile ? undefined : videoHeight,
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function loadVideo() {
  const video = await setupCamera();
  video.play();

  return video;
}

class Camera extends React.Component {
  setupCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available'
      );
    }

    const { width, height } = this.props;

    const video = this.props.videoRef.current;

    const mobile = isMobile();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: mobile ? undefined : width,
        height: mobile ? undefined : height,
      },
    });
    video.srcObject = stream;

    return new Promise(resolve => {
      video.onloadedmetadata = () => {
        resolve(video);
      };
    });
  };

  startVideo = () => {
    const video = this.props.videoRef.current;
    video.play();
  };
  render() {
    return (
      <video
        ref={this.props.videoRef}
        width={this.props.width}
        height={this.props.height}
        playsInline
      />
    );
  };
};


const defaultQuantBytes = 2;

const defaultMobileNetMultiplier = isMobile() ? 0.50 : 0.75;
const defaultMobileNetStride = 16;
const defaultMobileNetInputResolution = 300; // defult was 500

const defaultResNetMultiplier = 1.0;
const defaultResNetStride = 32;
const defaultResNetInputResolution = 250;

const guiState = {
  algorithm: 'single-pose', // 'single-pose' OR 'multi-pose'
  input: {
    architecture: 'MobileNetV1',
    outputStride: defaultMobileNetStride,
    inputResolution: defaultMobileNetInputResolution,
    multiplier: defaultMobileNetMultiplier,
    quantBytes: defaultQuantBytes
  },
  singlePoseDetection: {
    minPoseConfidence: 0.1,
    minPartConfidence: 0.5,
  },
  multiPoseDetection: {
    maxPoseDetections: 5,
    minPoseConfidence: 0.15,
    minPartConfidence: 0.1,
    nmsRadius: 30.0,
  },
  output: {
    showVideo: true,
    showSkeleton: true,
    showPoints: true,
    showBoundingBox: false,
  },
  net: null,
};


/**
 * Sets up dat.gui controller on the top-right of the window
 */

function setupGui(cameras, net) {
  guiState.net = net;

  if (cameras.length > 0) {
    guiState.camera = cameras[0].deviceId;
  }

  const gui = new dat.GUI({width: 300});

  let architectureController = null;
  
/*  guiState[tryResNetButtonName] = function() {    // NOT NEEDED
    architectureController.setValue('ResNet50')
  };
*/
  //gui.add(guiState, tryResNetButtonName).name(tryResNetButtonText);/////////// removes 'tryRESNET' button
  //updateTryResNetButtonDatGuiCss(); ////////////////////////////////////////// removed

  // The single-pose algorithm is faster and simpler but requires only one
  // person to be in the frame or results will be innaccurate. Multi-pose works
  // for more than 1 person
  const algorithmController =
      gui.add(guiState, 'algorithm', ['single-pose', 'multi-pose']);



  // The input parameters have the most effect on accuracy and speed of the
  // network
  let input = gui.addFolder('Input');
  // Architecture: there are a few PoseNet models varying in size and
  // accuracy. 1.01 is the largest, but will be the slowest. 0.50 is the
  // fastest, but least accurate.
  architectureController =
      input.add(guiState.input, 'architecture', ['MobileNetV1', 'ResNet50']);
  guiState.architecture = guiState.input.architecture;
  // Input resolution:  Internally, this parameter affects the height and width
  // of the layers in the neural network. The higher the value of the input
  // resolution the better the accuracy but slower the speed.
  let inputResolutionController = null;
  function updateGuiInputResolution(
      inputResolution,
      inputResolutionArray,
  ) {
    if (inputResolutionController) {
      inputResolutionController.remove();
    }
    guiState.inputResolution = inputResolution;
    guiState.input.inputResolution = inputResolution;
    inputResolutionController =
      input.add(guiState.input, 'inputResolution', inputResolutionArray);
    inputResolutionController.onChange(function(inputResolution) {
      guiState.changeToInputResolution = inputResolution;
    });
  }

  // Output stride:  Internally, this parameter affects the height and width of
  // the layers in the neural network. The lower the value of the output stride
  // the higher the accuracy but slower the speed, the higher the value the
  // faster the speed but lower the accuracy.
  let outputStrideController = null;
  function updateGuiOutputStride(outputStride, outputStrideArray) {
    if (outputStrideController) {
      outputStrideController.remove();
    }
    guiState.outputStride = outputStride;
    guiState.input.outputStride = outputStride;
    outputStrideController =
        input.add(guiState.input, 'outputStride', outputStrideArray);
    outputStrideController.onChange(function(outputStride) {
      guiState.changeToOutputStride = outputStride;
    });
  }

  // Multiplier: this parameter affects the number of feature map channels in
  // the MobileNet. The higher the value, the higher the accuracy but slower the
  // speed, the lower the value the faster the speed but lower the accuracy.
  let multiplierController = null;
  function updateGuiMultiplier(multiplier, multiplierArray) {
    if (multiplierController) {
      multiplierController.remove();
    }
    guiState.multiplier = multiplier;
    guiState.input.multiplier = multiplier;
    multiplierController =
        input.add(guiState.input, 'multiplier', multiplierArray);
    multiplierController.onChange(function(multiplier) {
      guiState.changeToMultiplier = multiplier;
    });
  }

  // QuantBytes: this parameter affects weight quantization in the ResNet50
  // model. The available options are 1 byte, 2 bytes, and 4 bytes. The higher
  // the value, the larger the model size and thus the longer the loading time,
  // the lower the value, the shorter the loading time but lower the accuracy.
  let quantBytesController = null;
  function updateGuiQuantBytes(quantBytes, quantBytesArray) {
    if (quantBytesController) {
      quantBytesController.remove();
    }
    guiState.quantBytes = +quantBytes;
    guiState.input.quantBytes = +quantBytes;
    quantBytesController =
        input.add(guiState.input, 'quantBytes', quantBytesArray);
    quantBytesController.onChange(function(quantBytes) {
      guiState.changeToQuantBytes = +quantBytes;
    });
  }

  function updateGui() {
    if (guiState.input.architecture === 'MobileNetV1') {
      updateGuiInputResolution(
          defaultMobileNetInputResolution,
          [200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800]);
      updateGuiOutputStride(defaultMobileNetStride, [8, 16]);
      updateGuiMultiplier(defaultMobileNetMultiplier, [0.50, 0.75, 1.0]);
    } else {  // guiState.input.architecture === "ResNet50"
      updateGuiInputResolution(
          defaultResNetInputResolution,
          [200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800]);
      updateGuiOutputStride(defaultResNetStride, [32, 16]);
      updateGuiMultiplier(defaultResNetMultiplier, [1.0]);
    }
    updateGuiQuantBytes(defaultQuantBytes, [1, 2, 4]);
  }

  updateGui();
  input.open();
  // Pose confidence: the overall confidence in the estimation of a person's
  // pose (i.e. a person detected in a frame)
  // Min part confidence: the confidence that a particular estimated keypoint
  // position is accurate (i.e. the elbow's position)
  let single = gui.addFolder('Single Pose Detection');
  single.add(guiState.singlePoseDetection, 'minPoseConfidence', 0.0, 1.0);
  single.add(guiState.singlePoseDetection, 'minPartConfidence', 0.0, 1.0);

  let multi = gui.addFolder('Multi Pose Detection');
  multi.add(guiState.multiPoseDetection, 'maxPoseDetections')
      .min(1)
      .max(20)
      .step(1);
  multi.add(guiState.multiPoseDetection, 'minPoseConfidence', 0.0, 1.0);
  multi.add(guiState.multiPoseDetection, 'minPartConfidence', 0.0, 1.0);
  // nms Radius: controls the minimum distance between poses that are returned
  // defaults to 20, which is probably fine for most use cases
  multi.add(guiState.multiPoseDetection, 'nmsRadius').min(0.0).max(40.0);
  multi.open();

  let output = gui.addFolder('Output');
  output.add(guiState.output, 'showVideo');
  output.add(guiState.output, 'showSkeleton');
  output.add(guiState.output, 'showPoints');
  output.add(guiState.output, 'showBoundingBox');
  output.open();


  architectureController.onChange(function(architecture) {
    // if architecture is ResNet50, then show ResNet50 options
    updateGui();
    guiState.changeToArchitecture = architecture;
  });

  algorithmController.onChange(function(value) {
    switch (guiState.algorithm) {
      case 'single-pose':
        multi.close();
        single.open();
        break;
      case 'multi-pose':
        single.close();
        multi.open();
        break;
    }
  });
}



/**
 * Sets up a frames per second panel on the top-left of the window
 */

function setupFPS() {
  stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
  document.getElementById('main').appendChild(stats.dom);
}

/**
 * Feeds an image to posenet to estimate poses - this is where the magic
 * happens. This function loops with a requestAnimationFrame method.
 */


function detectPoseInRealTime(video, net) {
  const canvas = document.getElementById('output');
  const ctx = canvas.getContext('2d');

  // since images are being fed from a webcam, we want to feed in the
  // original image and then just flip the keypoints' x coordinates. If instead
  // we flip the image, then correcting left-right keypoint pairs requires a
  // permutation on all the keypoints.
  const flipPoseHorizontal = true;

  canvas.width = videoWidth;
  canvas.height = videoHeight;

  async function poseDetectionFrame() {
    if (guiState.changeToArchitecture) {
      // Important to purge variables and free up GPU memory
      guiState.net.dispose();
      //toggleLoadingUI(true);
      guiState.net = await posenet.load({
        architecture: guiState.changeToArchitecture,
        outputStride: guiState.outputStride,
        inputResolution: guiState.inputResolution,
        multiplier: guiState.multiplier,
      });
      //toggleLoadingUI(false);
      guiState.architecture = guiState.changeToArchitecture;
      guiState.changeToArchitecture = null;
    }

    if (guiState.changeToMultiplier) {
      guiState.net.dispose();
      //toggleLoadingUI(true);
      guiState.net = await posenet.load({
        architecture: guiState.architecture,
        outputStride: guiState.outputStride,
        inputResolution: guiState.inputResolution,
        multiplier: +guiState.changeToMultiplier,
        quantBytes: guiState.quantBytes
      });
      //toggleLoadingUI(false);
      guiState.multiplier = +guiState.changeToMultiplier;
      guiState.changeToMultiplier = null;
    }

    if (guiState.changeToOutputStride) {
      // Important to purge variables and free up GPU memory
      guiState.net.dispose();
      //toggleLoadingUI(true);
      guiState.net = await posenet.load({
        architecture: guiState.architecture,
        outputStride: +guiState.changeToOutputStride,
        inputResolution: guiState.inputResolution,
        multiplier: guiState.multiplier,
        quantBytes: guiState.quantBytes
      });
      //toggleLoadingUI(false);
      guiState.outputStride = +guiState.changeToOutputStride;
      guiState.changeToOutputStride = null;
    }

    if (guiState.changeToInputResolution) {
      // Important to purge variables and free up GPU memory
      guiState.net.dispose();
      //toggleLoadingUI(true);
      guiState.net = await posenet.load({
        architecture: guiState.architecture,
        outputStride: guiState.outputStride,
        inputResolution: +guiState.changeToInputResolution,
        multiplier: guiState.multiplier,
        quantBytes: guiState.quantBytes
      });
      //toggleLoadingUI(false);
      guiState.inputResolution = +guiState.changeToInputResolution;
      guiState.changeToInputResolution = null;
    }

    if (guiState.changeToQuantBytes) {
      // Important to purge variables and free up GPU memory
      guiState.net.dispose();
      //toggleLoadingUI(true);
      guiState.net = await posenet.load({
        architecture: guiState.architecture,
        outputStride: guiState.outputStride,
        inputResolution: guiState.inputResolution,
        multiplier: guiState.multiplier,
        quantBytes: guiState.changeToQuantBytes
      });
      //toggleLoadingUI(false);
      guiState.quantBytes = guiState.changeToQuantBytes;
      guiState.changeToQuantBytes = null;
    }

    // Begin monitoring code for frames per second
    stats.begin();

    let poses = [];
    let minPoseConfidence;
    let minPartConfidence;
    switch (guiState.algorithm) {
      case 'single-pose':
        const pose = await guiState.net.estimatePoses(video, {
          flipHorizontal: flipPoseHorizontal,
          decodingMethod: 'single-person'
        });
        poses = poses.concat(pose);
        minPoseConfidence = +guiState.singlePoseDetection.minPoseConfidence;
        minPartConfidence = +guiState.singlePoseDetection.minPartConfidence;
        break;
      case 'multi-pose':
        let all_poses = await guiState.net.estimatePoses(video, {
          flipHorizontal: flipPoseHorizontal,
          decodingMethod: 'multi-person',
          maxDetections: guiState.multiPoseDetection.maxPoseDetections,
          scoreThreshold: guiState.multiPoseDetection.minPartConfidence,
          nmsRadius: guiState.multiPoseDetection.nmsRadius
        });

        poses = poses.concat(all_poses);
        minPoseConfidence = +guiState.multiPoseDetection.minPoseConfidence;
        minPartConfidence = +guiState.multiPoseDetection.minPartConfidence;
        break;
    }

    ctx.clearRect(0, 0, videoWidth, videoHeight);

    if (guiState.output.showVideo) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-videoWidth, 0);
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
      ctx.restore();
    }

    // For each pose (i.e. person) detected in an image, loop through the poses
    // and draw the resulting skeleton and keypoints if over certain confidence
    // scores
    poses.forEach(({score, keypoints}) => {
      if (score >= minPoseConfidence) {
        if (guiState.output.showPoints) {
          drawKeypoints(keypoints, minPartConfidence, ctx);
        }
        if (guiState.output.showSkeleton) {
          drawSkeleton(keypoints, minPartConfidence, ctx);
        }
        if (guiState.output.showBoundingBox) {
          drawBoundingBox(keypoints, ctx);
        }
      }
    });

    // End monitoring code for frames per second
    stats.end();

    requestAnimationFrame(poseDetectionFrame);
  }

  poseDetectionFrame();
}



/**
 * Kicks off the demo by loading the posenet model, finding and loading
 * available camera devices, and setting off the detectPoseInRealTime function.
 */

export async function bindPage() {
  toggleLoadingUI(true);
  const net = await posenet.load({
    architecture: guiState.input.architecture,
    outputStride: guiState.input.outputStride,
    inputResolution: guiState.input.inputResolution,
    multiplier: guiState.input.multiplier,
    quantBytes: guiState.input.quantBytes
  });
  toggleLoadingUI(false);

  let video;

*  try {
    video = await loadVideo();
  } catch (e) {
    let info = document.getElementById('info');
    info.textContent = 'this browser does not support video capture,' +
        'or this device does not have a camera';
    info.style.display = 'block';
    throw e;
  }

  setupGui([], net);
  setupFPS();
  detectPoseInRealTime(video, net);
}
navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
// kick off the demo
bindPage();
