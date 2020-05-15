import React, { useState, useRef } from 'react';
import { toPairs } from 'lodash';
import importAll from 'import-all.macro';

import Video from './Video';

import {
  loadPoseData,  // created and returned VPTREE <-- imagePaths
  usePoseDetection,
  useRepsCounter, // used VPTREE <-- imagePaths
  mediaSize,
} from './poseUtils';

//import {startExercise, stopExercise} from './voice_player'

// imports list all DEMO videos
const videoFiles = toPairs(importAll.sync('../Demos/*')); // '../videos/**/*.mov'

function MediaPose({ src, poseData }) {
  const [play, setPlay] = useState(false);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  const pose = usePoseDetection(
    play,
    poseData.net,
    videoRef.current,
    canvasRef.current
  );
  const reps = useRepsCounter(pose, poseData.vptree);
  var per = reps*100/12; ////////////////////////////////////// percentage
  var percent = per.toFixed(1);

  return (
    <div
      style={{
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'}}>
      <div>
        <span style={{
            position: 'absolute',
            color: '#1faf5b', // '#AF1F24' original color for counter
            fontWeight: 'bold',
            fontSize: 68,
            width: 100,
            height: 100,
            backgroundColor: '#ffffff90',
            wordWrap: 'break-word',
            whiteSpace: 'pre-line',
            top: '0%',
          }}>
          {reps}
        </span>
        <span
          style={{
            position: 'absolute',
            width: 100,
            height: 50,
            backgroundColor: '#ffffff90',
            left: '58.5%',
          }}
        >
        </span>
        <span
          style={{
            position: 'absolute',
            color: '#508a68',
            fontWeight: 'bold',
            fontSize: 30,
            width: per,
            height: 50,
            backgroundColor: '#9dd1b2',
            whiteSpace: 'pre-line',
            left: '58.5%',
          }}
        >
          {percent}
          &#37;
        </span>

        <canvas
          width={mediaSize}
          height={mediaSize}
          ref={canvasRef}
          style={{ position: 'absolute' }}
        />

        <Video
          controls
          width={mediaSize}
          height={mediaSize}
          src={src}
          play={play}
          videoRef={videoRef}
        />

      </div>

      <button
        style={{ height: 40, width: 100, margin: 'auto' }}
        onClick={() => setPlay(true)}
      >
        START
      </button>
    </div>
  ); //end of Return
} // end of MediaPose function

class Images extends React.Component {
  state = {
    loadedPoses: false,
    // videoFiles are all DEMO videos
    src: videoFiles[0][1],
  };
//this.poseData is the this.props
  setup = async () => {
    this.poseData = await loadPoseData();                  // need to assign a value to this from Option menu
    /*console.log('LOADED 0!!!');
    this.poseData1 = await loadPoseData1();                  // need to assign a value to this from Option menu
     */                 // need to assign a value to this from Option menu
    console.log('LOADED all stored videos!!!');

    this.setState({ loadedPoses: true });
  };

  async componentDidMount() { // for interaction with the browser
    await this.setup();
  }

  render() {
    const { loadedPoses, src } = this.state;
    return ( //returns the react element, component MediaPose
      loadedPoses && (
        <div>
          <MediaPose key={src} src={src} poseData={this.poseData} />

          <select
            defaultValue={src}
            onChange={e => this.setState({ src: e.target.value})}
          >
            <option value="camera" >Camera</option>
            <option value="camera" >Knee Extension</option>
            <option value="camera" >Lunge</option>
            <option value="camera" >Plank</option>
            <option value="camera" >Push ups</option>
            <option value="camera" >Seated Foward Bend</option>
            <option value="camera" >Seated Hamstring Stretch</option>
            <option value="camera" >Side Plank</option>
            <option value="camera" >Single Knee to Chest</option>
            <option value="camera" >Squat</option>
            <option value="camera" >Standing Foward Bend</option>
            <option value="camera" >Wall Slides</option>

            {videoFiles.map(([filename, path]) => (
              <option key={path} value={path}>
                {filename}
              </option>
            ))}

          </select>
        </div>
      )
    );
  }
}

export default Images;
