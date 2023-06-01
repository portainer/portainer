import { name } from './name';
import { type } from './type';
import { namespace } from './namespace';
import { ports } from './ports';
import { clusterIP } from './clusterIP';
import { externalIP } from './externalIP';
import { targetPorts } from './targetPorts';
import { application } from './application';
import { created } from './created';

export const columns = [
  name,
  application,
  namespace,
  type,
  ports,
  targetPorts,
  clusterIP,
  externalIP,
  created,
];
