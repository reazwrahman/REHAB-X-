import importAll from 'import-all.macro';
import { toPairs } from 'lodash';

const downPaths11 = toPairs(importAll.sync('./down/*.jpg'));
const upPaths11 = toPairs(importAll.sync('./up/*.jpg'));

export const imagePaths11 = [
  ...downPaths11.map(([_, path]) => path),
  ...upPaths11.map(([_, path]) => path),
];
export const imageCategories11 = [
  ...downPaths11.map(_ => 'down'),
  ...upPaths11.map(_ => 'up'),
];
