import { useEffect, useState } from 'react';
import * as posenet from '@tensorflow-models/posenet';
//import similarity from 'compute-cosine-similarity'; //not implemented
import l2norm from 'compute-l2norm';
import VPTreeFactory from 'vptree';
import { sortBy, chain } from 'lodash';
import { drawKeypoints, drawSkeleton } from './demo_util';

import { imagePaths0, imageCategories0, //double knee to chest
  imagePaths1, imageCategories1,  // knee Extension
  imagePaths2, imageCategories2,  // lunge
  imagePaths3, imageCategories3,  // Plank
  imagePaths4, imageCategories4,  // Push-ups
  imagePaths5, imageCategories5,  // Seated foward bend
  imagePaths6, imageCategories6,  // Seated Hamstring Stretch
  imagePaths7, imageCategories7,  // Side Plank
  imagePaths8, imageCategories8,  // Single Knee to Chest
  imagePaths9, imageCategories9,  // Squat
  imagePaths10, imageCategories10,  // Standing Foward Bend
  imagePaths11, imageCategories11 } from '../dataset'; // Wall Slides

export const mediaSize = 500; // sent to VideoSelector
const imageScaleFactor = 0.5;
const outputStride = 32;
const flipHorizontal = false;
const minPartConfidence = 0.1;
const minConsecutivePoses = 10;

//added array inside load() to improve tracking
export async function loadPoseData() {
  const net = await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: 300,
      multiplier: 0.75
  });

  const poseData = await buildPoseData(net, imagePaths2); ////////////////////////////////////////////////////// dataset LOCATION
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
    //added dependecies net and canvas
    [net, video, canvas]
  ); // end of useEffect
  return pose;
}

// calls on 'findMostSimilarMatch' function, uses vptree
export function useRepsCounter(pose, vptree) {
  const [counter] = useState([]);
  if (pose) {
    const match = findMostSimilarMatch(vptree, pose);
    incrementPoseCount(counter, match.category);
    const reps = countTotalReps(counter, 2);

      for(var i=0;i<reps.length;i++){
        var current = reps[i];
        var previous = reps[i-1];
        console.log(current)
        console.log(previous)
      }
      if(current>previous){
        //console.log(reps)
          audio5.play(); /////////////////////////////////////////////////////////// voice_player for "great_job"
      }
      //console.log(reps)

    return reps;
  }
  return 0;
}

// cosineDistanceMatching should be used to improve matching
/*
function cosineDistanceMatching(poseVector1, poseVector2) {
  let cosineSimilarity = similarity(poseVector1, poseVector2);
  let distance = 2 * (1 - cosineSimilarity);
  return Math.sqrt(distance);
}
*/

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

// search the 'vptree' for the image pose that is nearest (in cosine distance) to userPose
function findMostSimilarMatch(vptree, userPose) {
  const pose = convertPoseToVector(userPose);
  let nearestImage = vptree.search(pose);

  // return index (in relation to poseData) of nearest match.
  return {
    index: nearestImage[0].i,
    score: nearestImage[0].d, // score is also distance
    category: imageCategories2[nearestImage[0].i], /////////////////////////////////////////////////////////////// dataset LOCATION
  };
}

// imagePath becomes 'paths'
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

//FOR VIDEOS recordings
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
var audio1 = document.getElementById('start_knee_extension')
var audio2 = document.getElementById('stop_knee_extension')
var audio3 = document.getElementById('higher')
var audio4 = document.getElementById('lower')
var audio5 = document.getElementById('great_job')


function incrementPoseCount(counter, category) {

  var audio1 = document.getElementById('start_knee_extension')
  var audio2 = document.getElementById('stop_knee_extension')
  var audio3 = document.getElementById('higher')
  var audio4 = document.getElementById('lower')
  var audio5 = document.getElementById('great_job')

  if (counter.length === 0) {
    counter.push([category, 1]);

  } else if (counter[counter.length - 1][0] === category) { // category means UP or DOWN
    counter[counter.length - 1][1]++;
        //console.log(category)
        //audio5.play(); /////////////////////////////////////////////////////////// voice_player for "great_job"
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
