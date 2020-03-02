# REHAB X CENTRAL SOFTWARE DEVELOPMENT PLATFORM 
###  1)EMBEDDED SOFTWARE  
    - HAPTIC MOTORS
    - MPU6050 SENSORS 
    - 3D MODELING
###  2) REAL TIME HUMAN POSE ESTIMATION 
    - test out the squat counting model with the javascript model
    - experiment with the tf pose python model for counting press and squat
  
### Installing demos

1. Use terminal and enter commands

>> cd rehab-x

2. Installs DEPENDENCIES, which adds 'node_modules' and 'yarn.lock' file to folder

>> yarn

>> yarn build && yarn yalc publish

>> cd demos

3. Install DEPENDENCIES again

>> yarn

4. Links the local posenet to the demos

>> yarn yalc link @tensorflow-models/posenet

5. Finally, enjoy your new toy!

>> yarn watch

Installing Exercise counter

1. Use terminal and enter commands

>> cd rehab-x/exercise

2. Installs DEPENDENCIES,

>> yarn

3. Enjoy!

>> yarn watch
