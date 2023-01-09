export function atLeastTwo(a: boolean, b: boolean, c: boolean) {
  return (a && b) || (a && c) || (b && c);
}
