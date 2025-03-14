import { useMemo } from 'react';
import { BoxIcon } from 'lucide-react';
import { groupBy, partition } from 'lodash';
import { useRouter } from '@uirouter/react';

import { DefaultDatatableSettings } from '@/react/kubernetes/datatables/DefaultDatatableSettings';
import { SystemResourceDescription } from '@/react/kubernetes/datatables/SystemResourceDescription';
import { CreateFromManifestButton } from '@/react/kubernetes/components/CreateFromManifestButton';
import { useNamespacesQuery } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useAuthorizations } from '@/react/hooks/useUser';
import { isSystemNamespace } from '@/react/kubernetes/namespaces/queries/useIsSystemNamespace';
import { KubernetesApplicationTypes } from '@/kubernetes/models/application/models/appConstants';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { useIngresses } from '@/react/kubernetes/ingresses/queries';

import { TableSettingsMenu } from '@@/datatables';
import { DeleteButton } from '@@/buttons/DeleteButton';
import { AddButton } from '@@/buttons';
import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';

import { NamespaceFilter } from '../ApplicationsStacksDatatable/NamespaceFilter';
import { PodKubernetesInstanceLabel, PodManagedByLabel } from '../../constants';
import { useApplications } from '../../queries/useApplications';
import { ApplicationsTableSettings } from '../useKubeAppsTableStore';
import { useDeleteApplicationsMutation } from '../../queries/useDeleteApplicationsMutation';
import { getStacksFromApplications } from '../ApplicationsStacksDatatable/getStacksFromApplications';

import { Application, ApplicationRowData, ConfigKind } from './types';
import { useColumns } from './useColumns';
import { getPublishedUrls } from './PublishedPorts';
import { SubRow } from './SubRow';
import { HelmInsightsBox } from './HelmInsightsBox';

export function ApplicationsDatatable({
  tableState,
  hideStacks = false,
}: {
  hideStacks?: boolean;
  tableState: ApplicationsTableSettings & {
    setSearch: (value: string) => void;
    search: string;
  };
}) {
  const router = useRouter();
  const environmentId = useEnvironmentId();
  const restrictSecretsQuery = useEnvironment(
    environmentId,
    (env) => env.Kubernetes.Configuration.RestrictSecrets
  );
  const namespaceListQuery = useNamespacesQuery(environmentId);
  const { authorized: hasWriteAuth } = useAuthorizations(
    'K8sApplicationsW',
    undefined,
    false
  );
  const applicationsQuery = useApplications(environmentId, {
    refetchInterval: tableState.autoRefreshRate * 1000,
    namespace: tableState.namespace,
  });
  const ingressesQuery = useIngresses(environmentId);
  const ingresses = ingressesQuery.data ?? [];
  const applications = useApplicationsRowData(applicationsQuery.data);
  const filteredApplications = tableState.showSystemResources
    ? applications
    : applications.filter(
        (application) =>
          !isSystemNamespace(application.ResourcePool, namespaceListQuery.data)
      );
  const stacks = getStacksFromApplications(filteredApplications);
  const removeApplicationsMutation = useDeleteApplicationsMutation({
    environmentId,
    stacks,
    ingresses,
    reportStacks: false,
  });

  const columns = useColumns(hideStacks);

  return (
    <ExpandableDatatable
      data-cy="k8sApp-appTable"
      dataset={filteredApplications ?? []}
      settingsManager={tableState}
      columns={columns}
      title="Applications"
      titleIcon={BoxIcon}
      isLoading={applicationsQuery.isLoading}
      disableSelect={!hasWriteAuth}
      isRowSelectable={(row) =>
        !isSystemNamespace(row.original.ResourcePool, namespaceListQuery.data)
      }
      getRowCanExpand={(row) => isExpandable(row.original)}
      renderSubRow={(row) => (
        <SubRow
          item={row.original}
          hideStacks={hideStacks}
          areSecretsRestricted={!!restrictSecretsQuery.data}
        />
      )}
      renderTableActions={(selectedItems) =>
        hasWriteAuth && (
          <>
            <DeleteButton
              data-cy="k8sApp-removeAppButton"
              disabled={selectedItems.length === 0}
              isLoading={removeApplicationsMutation.isLoading}
              confirmMessage="Do you want to remove the selected application(s)?"
              onConfirmed={() => handleRemoveApplications(selectedItems)}
            />
            <AddButton data-cy="k8sApp-addApplicationButton" color="secondary">
              Add with form
            </AddButton>
            <CreateFromManifestButton data-cy="k8sApp-deployFromManifestButton" />
          </>
        )
      }
      renderTableSettings={() => (
        <TableSettingsMenu>
          <DefaultDatatableSettings settings={tableState} />
        </TableSettingsMenu>
      )}
      description={
        <div className="w-full">
          <div className="min-w-[140px] float-right">
            <NamespaceFilter
              namespaces={namespaceListQuery.data ?? []}
              value={tableState.namespace}
              onChange={tableState.setNamespace}
              showSystem={tableState.showSystemResources}
            />
          </div>
          <div className="space-y-2">
            <SystemResourceDescription
              showSystemResources={tableState.showSystemResources}
            />
            <div className="w-fit">
              <HelmInsightsBox />
            </div>
          </div>
        </div>
      }
    />
  );

  function handleRemoveApplications(applications: ApplicationRowData[]) {
    removeApplicationsMutation.mutate(applications, {
      onSuccess: () => {
        router.stateService.reload();
      },
    });
  }
}

function useApplicationsRowData(
  applications?: Application[]
): ApplicationRowData[] {
  return useMemo(() => separateHelmApps(applications ?? []), [applications]);
}

function separateHelmApps(applications: Application[]): ApplicationRowData[] {
  const [helmApps, nonHelmApps] = partition(
    applications,
    (app) =>
      app.Metadata?.labels &&
      app.Metadata.labels[PodKubernetesInstanceLabel] &&
      app.Metadata.labels[PodManagedByLabel] === 'Helm'
  );

  const groupedHelmApps: Record<string, Application[]> = groupBy(
    helmApps,
    (app) => app.Metadata?.labels[PodKubernetesInstanceLabel] ?? ''
  );

  // build the helm apps row data from the grouped helm apps
  const helmAppsRowData = Object.entries(groupedHelmApps).reduce<
    ApplicationRowData[]
  >((helmApps, [appName, apps]) => {
    const helmApp = buildHelmAppRowData(appName, apps);
    return [...helmApps, helmApp];
  }, []);

  return [...helmAppsRowData, ...nonHelmApps];
}

function buildHelmAppRowData(
  appName: string,
  apps: Application[]
): ApplicationRowData {
  const id = `${apps[0].ResourcePool}-${appName
    .toLowerCase()
    .replaceAll(' ', '-')}`;
  const { earliestCreationDate, runningPods, totalPods } = apps.reduce(
    (acc, app) => ({
      earliestCreationDate:
        new Date(app.CreationDate) < new Date(acc.earliestCreationDate)
          ? app.CreationDate
          : acc.earliestCreationDate,
      runningPods: acc.runningPods + app.RunningPodsCount,
      totalPods: acc.totalPods + app.TotalPodsCount,
    }),
    {
      earliestCreationDate: apps[0].CreationDate,
      runningPods: 0,
      totalPods: 0,
    }
  );
  const helmApp: ApplicationRowData = {
    ...apps[0],
    Name: appName,
    Id: id,
    KubernetesApplications: apps,
    ApplicationType: KubernetesApplicationTypes.Helm,
    Status: runningPods < totalPods ? 'Not ready' : 'Ready',
    CreationDate: earliestCreationDate,
    RunningPodsCount: runningPods,
    TotalPodsCount: totalPods,
  };
  return helmApp;
}

function isExpandable(item: ApplicationRowData) {
  return (
    !!item.KubernetesApplications ||
    !!getPublishedUrls(item).length ||
    hasConfigurationSecrets(item)
  );
}

function hasConfigurationSecrets(item: Application) {
  return !!item.Configurations?.some(
    (config) => config.Data && config.Kind === ConfigKind.Secret
  );
}
