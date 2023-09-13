import { createColumnHelper } from '@tanstack/react-table';

import { DockerImage } from '@/react/docker/images/types';

export const columnHelper = createColumnHelper<
  DockerImage & { NodeName?: string }
>();

/**
 * Docker response from proxy (with added portainer metadata)
 * images view model
 * images snapshot
 * snapshots view model
 *
 *
 */
