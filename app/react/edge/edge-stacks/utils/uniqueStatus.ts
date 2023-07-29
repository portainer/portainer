import { DeploymentStatus } from '../types';

/**
 * returns the latest status object of each type
 */
export function uniqueStatus(statusArray: Array<DeploymentStatus> = []) {
  // keep only the last status object of each type, assume that the last status is the most recent
  return statusArray.reduce((acc, status) => {
    const index = acc.findIndex((s) => s.Type === status.Type);
    if (index === -1) {
      return [...acc, status];
    }

    return [...acc.slice(0, index), ...acc.slice(index + 1), status];
  }, [] as Array<DeploymentStatus>);
}
