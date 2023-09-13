import { Job } from '@/react/nomad/types';

import { buildExpandColumn } from '@@/datatables/expand-column';

import { name } from './name';
import { status } from './status';
import { created } from './created';
import { actions } from './actions';
import { namespace } from './namespace';

const expand = buildExpandColumn<Job>();

export const columns = [expand, name, status, namespace, actions, created];
