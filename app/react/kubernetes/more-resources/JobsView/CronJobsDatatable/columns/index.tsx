import { expand } from './expand';
import { name } from './name';
import { namespace } from './namespace';
import { schedule } from './schedule';
import { suspend } from './suspend';
import { timezone } from './timezone';
import { command } from './command';

export const columns = [
  expand,
  name,
  namespace,
  command,
  schedule,
  suspend,
  timezone,
];
