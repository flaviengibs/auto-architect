// God module with too many dependencies
import { a } from './module-a';
import { b } from './module-b';
import { c } from './module-c';
import { d } from './module-d';
import { e } from './module-e';
import { f } from './module-f';
import { g } from './module-g';
import { h } from './module-h';
import { i } from './module-i';
import { j } from './module-j';
import { k } from './module-k';
import { l } from './module-l';

export function godFunction() {
  if (a && b && c && d && e && f) {
    for (let i = 0; i < 10; i++) {
      while (g && h) {
        if (i && j && k && l) {
          return true;
        }
      }
    }
  }
  return false;
}
