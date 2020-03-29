import React, {Component} from "react";
//import logo from './logo.svg';
import './App.css';
//import Loading from "./demos/Loading" // created 'loading...'
// create camera set up
//import Camera from "./demos/camera"
import VideoSelector from "./demos/VideoSelector"

//created this class
class App extends Component{
  render(){
    return(
      <div className="App">
      <VideoSelector />
      </div>
    );
  }
}

/*function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="camera.html"  // "https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Get Started
        </a>
      </header>
    </div>
  );
}
*/
export default App;
