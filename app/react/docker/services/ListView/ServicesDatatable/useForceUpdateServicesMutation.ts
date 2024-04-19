import { useMutation } from '@tanstack/react-query';

import { promiseSequence } from '@/portainer/helpers/promise-utils';
import { withError } from '@/react-tools/react-query';
import { forceUpdateService } from '@/react/portainer/environments/environment.service';
import { EnvironmentId } from '@/react/portainer/environments/types';

export function useForceUpdateServicesMutation(environmentId: EnvironmentId) {
  return useMutation(
    ({ ids, pullImage }: { ids: Array<string>; pullImage: boolean }) =>
      promiseSequence(
        ids.map((id) => () => forceUpdateService(environmentId, id, pullImage))
      ),
    withError('Failed to remove services')
  );
}
