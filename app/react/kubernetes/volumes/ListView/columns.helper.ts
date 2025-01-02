import { createColumnHelper } from '@tanstack/react-table';

import { VolumeViewModel } from './types';

export const helper = createColumnHelper<VolumeViewModel>();
