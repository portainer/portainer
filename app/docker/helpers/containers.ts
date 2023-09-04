import { splitargs } from './splitargs';

export function commandStringToArray(command: string) {
  return splitargs(command);
}

export function commandArrayToString(array: string[]) {
  return array.map((elem) => `'${elem}'`).join(' ');
}
