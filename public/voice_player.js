
console.log ("hello_world");
var audio1 = document.getElementById("start_knee_extension");
var audio2 = document.getElementById("stop_knee_extension");
var audio3 = document.getElementById("higher");
var audio4 = document.getElementById("lower");
var audio5 = document.getElementById("great_job");

function startExercise() // added export
{
  audio1.play();
}

function stopExercise() // added export
{
  audio2.play();
}
function higher() // added export
{
  audio3.play();
}

function lower() // added export
{
  audio4.play();
}
function great_job() // added export
{
  audio5.play();
}
