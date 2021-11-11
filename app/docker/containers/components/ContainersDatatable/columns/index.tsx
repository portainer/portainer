import { useMemo } from 'react';

import { buildSelectionColumn } from '@/portainer/components/datatables/components/selectionColumn';
import type { DockerContainer } from '@/docker/containers/types';

import { created } from './created';
import { host } from './host';
import { image } from './image';
import { ip } from './ip';
import { name } from './name';
import { ownership } from './ownership';
import { ports } from './ports';
import { quickActions } from './quick-actions';
import { stack } from './stack';
import { state } from './state';

export function useColumns() {
  return useMemo(
    () => [
      buildSelectionColumn<DockerContainer>(),
      name,
      state,
      quickActions,
      stack,
      image,
      created,
      ip,
      host,
      ports,
      ownership,
    ],
    []
  );
}
