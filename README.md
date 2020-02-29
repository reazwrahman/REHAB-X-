REHAB X CENTRAL SOFTWARE DEVELOPMENT PLATFORM
  1)EMBEDDED SOFTWARE
    -HAPTIC MOTORS
    -MPU6050 SENSORS
    -3D MODELING
  2) REAL TIME HUMAN POSE ESTIMATION
    -
    -

///////////////////////// Below was added by Eric /////////////////////////

1. Copied and Modified 'package.json' from PoseNet folder
2. Use terminal and enter commands

>> cd rehab-x

3. Installs DEPENDENCIES, which adds 'node_modules' and 'yarn.lock' file to folder

>> yarn
>> yarn build && yarn yalc publish
>> cd demos

4. Install DEPENDENCIES again

>> yarn

5. Links the local posenet to the demos

>> yarn yalc link @tensorflow-models/posenet

6. Finally, enjoy your new toy!

>> yarn watch
