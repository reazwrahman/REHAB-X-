import importAll from 'import-all.macro';
import { toPairs } from 'lodash';

const downPaths0 = toPairs(importAll.sync('./dkchest/down/*.jpg'));
const upPaths0 = toPairs(importAll.sync('./dkchest/up/*.jpg'));

const downPaths1 = toPairs(importAll.sync('./kneeExt/down/*.jpg'));
const upPaths1 = toPairs(importAll.sync('./kneeExt/up/*.jpg'));

const downPaths2 = toPairs(importAll.sync('./lunge/down/*.jpg'));
const upPaths2 = toPairs(importAll.sync('./lunge/up/*.jpg'));

const downPaths3 = toPairs(importAll.sync('./plank/down/*.jpg'));
const upPaths3 = toPairs(importAll.sync('./plank/up/*.jpg'));

const downPaths4 = toPairs(importAll.sync('./pushup/down/*.jpg'));
const upPaths4 = toPairs(importAll.sync('./pushup/up/*.jpg'));

const downPaths5 = toPairs(importAll.sync('./seatedFow/down/*.jpg'));
const upPaths5 = toPairs(importAll.sync('./seatedFow/up/*.jpg'));

const downPaths6 = toPairs(importAll.sync('./seatedHam/down/*.jpg'));
const upPaths6 = toPairs(importAll.sync('./seatedHam/up/*.jpg'));

const downPaths7 = toPairs(importAll.sync('./sideP/down/*.jpg'));
const upPaths7 = toPairs(importAll.sync('./sideP/up/*.jpg'));

const downPaths8 = toPairs(importAll.sync('./singleKnee/down/*.jpg'));
const upPaths8 = toPairs(importAll.sync('./singleKnee/up/*.jpg'));

const downPaths9 = toPairs(importAll.sync('./squat/down/*.jpg'));
const upPaths9 = toPairs(importAll.sync('./squat/up/*.jpg'));

const downPaths10 = toPairs(importAll.sync('./standingFow/down/*.jpg'));
const upPaths10 = toPairs(importAll.sync('./standingFow/up/*.jpg'));

const downPaths11 = toPairs(importAll.sync('./wallSlide/down/*.jpg'));
const upPaths11 = toPairs(importAll.sync('./wallSlide/up/*.jpg'));

////////////////////////// IMAGES

export const imagePaths0 = [
  ...downPaths0.map(([_, path]) => path),
  ...upPaths0.map(([_, path]) => path),
];
export const imagePaths1 = [
  ...downPaths1.map(([_, path]) => path),
  ...upPaths1.map(([_, path]) => path),
];
export const imagePaths2 = [
  ...downPaths2.map(([_, path]) => path),
  ...upPaths2.map(([_, path]) => path),
];
export const imagePaths3 = [
  ...downPaths3.map(([_, path]) => path),
  ...upPaths3.map(([_, path]) => path),
];
export const imagePaths4 = [
  ...downPaths4.map(([_, path]) => path),
  ...upPaths4.map(([_, path]) => path),
];
export const imagePaths5 = [
  ...downPaths5.map(([_, path]) => path),
  ...upPaths5.map(([_, path]) => path),
];
export const imagePaths6 = [
  ...downPaths6.map(([_, path]) => path),
  ...upPaths6.map(([_, path]) => path),
];
export const imagePaths7 = [
  ...downPaths7.map(([_, path]) => path),
  ...upPaths7.map(([_, path]) => path),
];
export const imagePaths8 = [
  ...downPaths8.map(([_, path]) => path),
  ...upPaths8.map(([_, path]) => path),
];
export const imagePaths9 = [
  ...downPaths9.map(([_, path]) => path),
  ...upPaths9.map(([_, path]) => path),
];
export const imagePaths10 = [
  ...downPaths10.map(([_, path]) => path),
  ...upPaths10.map(([_, path]) => path),
];
export const imagePaths11 = [
  ...downPaths11.map(([_, path]) => path),
  ...upPaths11.map(([_, path]) => path),
];

/////////////////////////// Catergories

export const imageCategories0 = [
  ...downPaths0.map(_ => 'down'),
  ...upPaths0.map(_ => 'up'),
];
export const imageCategories1 = [
  ...downPaths1.map(_ => 'down'),
  ...upPaths1.map(_ => 'up'),
];export const imageCategories2 = [
  ...downPaths2.map(_ => 'down'),
  ...upPaths2.map(_ => 'up'),
];export const imageCategories3 = [
  ...downPaths3.map(_ => 'down'),
  ...upPaths3.map(_ => 'up'),
];export const imageCategories4 = [
  ...downPaths4.map(_ => 'down'),
  ...upPaths4.map(_ => 'up'),
];export const imageCategories5 = [
  ...downPaths5.map(_ => 'down'),
  ...upPaths5.map(_ => 'up'),
];export const imageCategories6 = [
  ...downPaths6.map(_ => 'down'),
  ...upPaths6.map(_ => 'up'),
];export const imageCategories7 = [
  ...downPaths7.map(_ => 'down'),
  ...upPaths7.map(_ => 'up'),
];export const imageCategories8 = [
  ...downPaths8.map(_ => 'down'),
  ...upPaths8.map(_ => 'up'),
];export const imageCategories9 = [
  ...downPaths9.map(_ => 'down'),
  ...upPaths9.map(_ => 'up'),
];export const imageCategories10 = [
  ...downPaths10.map(_ => 'down'),
  ...upPaths10.map(_ => 'up'),
];export const imageCategories11 = [
  ...downPaths11.map(_ => 'down'),
  ...upPaths11.map(_ => 'up'),
];
