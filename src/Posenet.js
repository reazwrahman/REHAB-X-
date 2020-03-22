import React, {Component} from "react";

// This .js file replaces 'camera.html' and load posenet

class Posenet extends Component{
  render(){
    return(
      <div>
      <p> PoseNet - Camera Feed Demo </p>
      <div id="info" style={{display:'none'}}></div>
      <div id="loading" style={{display:'flex'}}>
          <div className="spinner-text">
              Loading PoseNet model...
          </div>
          <div className="sk-spinner sk-spinner-pulse"></div>
      </div>
      <div id='main' style={{display:'none'}}>
          <video id="video" playsInline style={{display: 'none'}}></video>
          <canvas id="output" />
      </div>
      <div className="footer">
          <div className="footer-text">
              <p>
                  PoseNet runs with either a <strong>single-pose</strong> or <strong>multi-pose</strong> detection
                  algorithm. The single person pose detector is faster and more accurate but requires only one subject
                  present in the image.
                  <br/>
                  <br/> The <strong>output stride</strong> and <strong>input resolution</strong> have the largest effects
                  on accuracy/speed. A <i>higher</i> output stride results in lower accuracy but higher speed. A
                  <i>higher</i> image scale factor results in higher accuracy but lower speed.
              </p>
          </div>
      </div>
      </div>
    );
  }
}

export default Posenet
