export const MinPasswordLen = 12;

function lengthCheck(password: string) {
  return password.length >= MinPasswordLen;
}

function comboCheck(password: string) {
  let count = 0;
  const regexps = [/[a-z]/, /[A-Z]/, /[0-9]/, /[\W_]/];

  regexps.forEach((re) => {
    if (password.match(re) != null) {
      count += 1;
    }
  });

  return count >= 3;
}

export function StrengthCheck(password: string) {
  return lengthCheck(password) && comboCheck(password);
}
