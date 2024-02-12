import { pod } from './pod';
import { name } from './name';
import { image } from './image';
import { imagePullPolicy } from './imagePullPolicy';
import { status } from './status';
import { node } from './node';
import { podIp } from './podIp';
import { creationDate } from './creationDate';
import { getActions } from './actions';

export function getColumns(isServerMetricsEnabled: boolean) {
  return [
    pod,
    name,
    image,
    imagePullPolicy,
    status,
    node,
    podIp,
    creationDate,
    getActions(isServerMetricsEnabled),
  ];
}
