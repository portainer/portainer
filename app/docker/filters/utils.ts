import _ from 'lodash';

export function trimSHA(imageName: string) {
  if (!imageName) {
    return '';
  }
  if (imageName.indexOf('sha256:') === 0) {
    return imageName.substring(7, 19);
  }
  return _.split(imageName, '@sha256')[0];
}

export function joinCommand(command: null | Array<string> = []) {
  if (!command) {
    return '';
  }

  return command.join(' ');
}
