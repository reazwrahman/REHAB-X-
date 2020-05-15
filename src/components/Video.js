import React from 'react';

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isMobile() {
  return isAndroid() || isiOS();
}

class Video extends React.Component {
  setupCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available'
      );
    }
    // if no Error, then proceeds to below
    // es6 class component for props/properties
    const { width, height } = this.props;

    // assigns 'video' a reference point
    const video = this.props.videoRef.current;

    const mobile = isMobile();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: mobile ? undefined : width, // true : false condition
        height: mobile ? undefined : height,
      },
    });

    video.srcObject = stream; // stream function defined above

    return new Promise(resolve => {
      video.onloadedmetadata = () => {
        resolve(video);
      };
    });
  }; // end of setupCamera async Function

  startVideo = () => {
    const video = this.props.videoRef.current;
    video.play();
  };

  componentDidUpdate(prevProps) {
    if (this.props.play && !prevProps.play) {
      this.startVideo();
    }
  }

  async componentDidMount() {
    const video = this.props.videoRef.current;
    video.width = this.props.width;
    video.height = this.props.height;
    if (this.props.src !== 'camera') {
      // instantiate Video from demos
      this.props.videoRef.current.src = this.props.src; // refers to video file, if not live feed
      console.log('Loaded demo', this.props.src)
    }
    else {
      await this.setupCamera();
      video.play();
      console.log('Loaded Camera')
    }
  }

  componentWillUnmount() {
    const video = this.props.videoRef.current;
    if (video.srcObject) {
      // destroy player on unmount after stopping
      video.srcObject.getTracks().forEach(t => t.stop());
    }
  }

  render() {
    return (
      <video
        ref={this.props.videoRef}
        width={this.props.width}
        height={this.props.height}
        playsInline
      />
    );
  }
} // end of class Video

export default Video;
