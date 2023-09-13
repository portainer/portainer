import { queryKeys as containerQueryKeys } from './container';
import { queryKeys as rootQueryKeys } from './root';

export const queryKeys = {
  ...rootQueryKeys,
  ...containerQueryKeys,
};

export {
  buildDockerSnapshotContainersUrl,
  type ContainersQueryParams,
} from './container';

export { buildDockerSnapshotUrl } from './root';
