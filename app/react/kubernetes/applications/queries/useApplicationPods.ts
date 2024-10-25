import { useQuery } from '@tanstack/react-query';
import { Pod } from 'kubernetes-types/core/v1';

import { withGlobalError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { applicationIsKind, matchLabelsToLabelSelectorValue } from '../utils';
import { Application } from '../types';

import { queryKeys } from './query-keys';
import { getPods } from './getPods';

// useApplicationPods returns a query for pods that are related to the application by the application selector labels
export function useApplicationPods(
  environmentId: EnvironmentId,
  namespace: string,
  appName: string,
  app?: Application,
  options?: { autoRefreshRate?: number }
) {
  return useQuery(
    queryKeys.applicationPods(environmentId, namespace, appName),
    async () => {
      if (applicationIsKind<Pod>('Pod', app)) {
        return [app];
      }
      const appSelector = app?.spec?.selector;
      const labelSelector = matchLabelsToLabelSelectorValue(
        appSelector?.matchLabels
      );

      // get all pods in the namespace using the application selector as the label selector query param
      const pods = await getPods(environmentId, namespace, labelSelector);
      return pods;
    },
    {
      ...withGlobalError(`Unable to get pods for ${appName}`),
      enabled: !!app,
      refetchInterval() {
        return options?.autoRefreshRate ?? false;
      },
    }
  );
}
