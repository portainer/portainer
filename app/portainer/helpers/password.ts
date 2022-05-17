export const MinPasswordLen = 12;

function lengthCheck(password: string) {
  return password.length >= MinPasswordLen;
}

export function StrengthCheck(password: string) {
  return lengthCheck(password);
}
