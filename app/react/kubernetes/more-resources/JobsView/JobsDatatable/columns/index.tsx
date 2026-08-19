import { name } from './name';
import { namespace } from './namespace';
import { started } from './started';
import { finished } from './finished';
import { duration } from './duration';
import { status } from './status';
import { actions } from './actions';
import { command } from './command';

export const columns = [
  name,
  namespace,
  command,
  status,
  started,
  finished,
  duration,
  actions,
];
