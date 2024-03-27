import { NodeStatus, TaskState } from 'docker-types/generated/1.41';
import _ from 'lodash';

export function trimVersionTag(fullName: string) {
  if (!fullName) {
    return fullName;
  }

  const versionIdx = fullName.lastIndexOf(':');
  if (versionIdx < 0) {
    return fullName;
  }

  const hostIdx = fullName.indexOf('/');
  if (hostIdx > versionIdx) {
    return fullName;
  }

  return fullName.substring(0, versionIdx);
}

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

export function nodeStatusBadge(text: NodeStatus['State']) {
  if (text === 'down' || text === 'unknown' || text === 'disconnected') {
    return 'danger';
  }

  return 'success';
}

export function hideShaSum(imageName = '') {
  return imageName.split('@sha')[0];
}

export function trimContainerName(name?: string) {
  if (name) {
    return name.indexOf('/') === 0 ? name.slice(1) : name;
  }
  return '';
}
