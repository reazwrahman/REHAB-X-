import importAll from 'import-all.macro';
import { toPairs } from 'lodash';

const downPaths9 = toPairs(importAll.sync('./down/*.jpg'));
const upPaths9 = toPairs(importAll.sync('./up/*.jpg'));

export const imagePaths9 = [
  ...downPaths9.map(([_, path]) => path),
  ...upPaths9.map(([_, path]) => path),
];
export const imageCategories9 = [
  ...downPaths9.map(_ => 'down'),
  ...upPaths9.map(_ => 'up'),
];
