import { useQuery } from '@tanstack/react-query';
import { Pod } from 'kubernetes-types/core/v1';

import { withGlobalError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { getNamespaceServices } from '../../services/service';
import type { Application } from '../types';
import { applicationIsKind } from '../utils';

import { queryKeys } from './query-keys';

// useApplicationServices returns a query for services that are related to the application (this doesn't include ingresses)
// Filtering the services by the application selector labels is done in the front end because:
// - The label selector query param in the kubernetes API filters by metadata.labels, but we need to filter the services by spec.selector
// - The field selector query param in the kubernetes API can filter the services by spec.selector, but it doesn't support chaining with 'OR',
//   so we can't filter by services with at least one matching label. See: https://kubernetes.io/docs/concepts/overview/working-with-objects/field-selectors/#chained-selectors
export function useApplicationServices(
  environmentId: EnvironmentId,
  namespace: string,
  appName: string,
  app?: Application
) {
  return useQuery(
    queryKeys.applicationServices(environmentId, namespace, appName),
    async () => {
      if (!app) {
        return [];
      }

      // get the selector labels for the application
      const appSelectorLabels = applicationIsKind<Pod>('Pod', app)
        ? app.metadata?.labels
        : app.spec?.template?.metadata?.labels;

      // get all services in the namespace and filter them by the application selector labels
      const services = await getNamespaceServices(environmentId, namespace);
      const filteredServices = services.filter((service) => {
        if (service.spec?.selector && appSelectorLabels) {
          const serviceSelectorLabels = service.spec.selector;
          // include the service if the service selector label matches at least one application selector label
          return Object.keys(appSelectorLabels).some(
            (key) =>
              serviceSelectorLabels[key] &&
              serviceSelectorLabels[key] === appSelectorLabels[key]
          );
        }
        return false;
      });
      return filteredServices;
    },
    {
      ...withGlobalError(`Unable to get services for ${appName}`),
      enabled: !!app,
    }
  );
}
