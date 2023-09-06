import _ from 'lodash';
import { TaskState } from 'docker-types/generated/1.41';

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

export function taskStatusBadge(text?: TaskState) {
  const status = _.toLower(text);
  if (
    [
      'new',
      'allocated',
      'assigned',
      'accepted',
      'preparing',
      'ready',
      'starting',
      'remove',
    ].includes(status)
  ) {
    return 'info';
  }

  if (['pending'].includes(status)) {
    return 'warning';
  }

  if (['shutdown', 'failed', 'rejected', 'orphaned'].includes(status)) {
    return 'danger';
  }

  if (['complete'].includes(status)) {
    return 'primary';
  }

  if (['running'].includes(status)) {
    return 'success';
  }
  return 'default';
}
