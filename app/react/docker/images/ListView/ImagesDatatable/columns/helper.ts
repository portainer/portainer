import { createColumnHelper } from '@tanstack/react-table';

import { ImagesListResponse } from '@/react/docker/images/queries/useImages';

export const columnHelper = createColumnHelper<ImagesListResponse>();
