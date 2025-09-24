import { useCurrentStateAndParams } from '@uirouter/react';
import { useQueryClient } from '@tanstack/react-query';

import helm from '@/assets/ico/vendor/helm.svg?c';
import { PageHeader } from '@/react/components/PageHeader';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized } from '@/react/hooks/useUser';
import { useNamespaceAccessRedirect } from '@/react/kubernetes/namespaces/hooks/useNamespaceAccessRedirect';

import { WidgetTitle, WidgetBody, Widget, Loading } from '@@/Widget';
import { Card } from '@@/Card';
import { Alert } from '@@/Alert';

import { HelmRelease } from '../types';
import { useIsSystemNamespace } from '../../namespaces/queries/useIsSystemNamespace';
import { useHelmRelease } from '../helmReleaseQueries/useHelmRelease';
import { useHelmHistory } from '../helmReleaseQueries/useHelmHistory';

import { HelmSummary } from './HelmSummary';
import { ReleaseTabs } from './ReleaseDetails/ReleaseTabs';
import { ChartActions } from './ChartActions/ChartActions';
import { HelmRevisionList } from './HelmRevisionList';
import { HelmRevisionListSheet } from './HelmRevisionListSheet';

export function HelmApplicationView() {
  const environmentId = useEnvironmentId();
  const queryClient = useQueryClient();
  const { params } = useCurrentStateAndParams();
  const { name, namespace, revision } = params;
  useNamespaceAccessRedirect(namespace, { to: 'kubernetes.applications' });
  const helmHistoryQuery = useHelmHistory(environmentId, name, namespace);
  const latestRevision = helmHistoryQuery.data?.[0]?.version;
  const earlistRevision =
    helmHistoryQuery.data?.[helmHistoryQuery.data.length - 1]?.version;
  // when loading the page fresh, the revision is undefined, so use the latest revision
  const selectedRevision = revision ? parseInt(revision, 10) : latestRevision;

  const helmReleaseQuery = useHelmRelease(environmentId, name, namespace, {
    showResources: true,
    revision: selectedRevision,
  });

  const isSystemNamespace = useIsSystemNamespace(namespace);

  return (
    <>
      <PageHeader
        title="Helm details"
        breadcrumbs={[
          { label: 'Applications', link: 'kubernetes.applications' },
          name,
        ]}
        reload
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget className="overflow-hidden">
            <div className="flex">
              <div className="flex-1 min-w-0">
                {name && (
                  <WidgetTitle icon={helm} title={name}>
                    <div className="flex gap-2 flex-wrap">
                      <div className="2xl:hidden">
                        <HelmRevisionListSheet
                          currentRevision={helmReleaseQuery.data?.version}
                          history={helmHistoryQuery.data}
                        />
                      </div>
                      <Authorized authorizations="K8sApplicationsW">
                        {!isSystemNamespace && (
                          <ChartActions
                            environmentId={environmentId}
                            releaseName={String(name)}
                            namespace={String(namespace)}
                            latestRevision={latestRevision ?? 1}
                            earlistRevision={earlistRevision}
                            selectedRevision={selectedRevision}
                            release={helmReleaseQuery.data}
                            updateRelease={(updatedRelease: HelmRelease) => {
                              queryClient.setQueryData(
                                [
                                  environmentId,
                                  'helm',
                                  'releases',
                                  namespace,
                                  name,
                                  true,
                                ],
                                updatedRelease
                              );
                            }}
                          />
                        )}
                      </Authorized>
                    </div>
                  </WidgetTitle>
                )}
                <WidgetBody className="!pt-2.5">
                  <HelmDetails
                    isLoading={helmReleaseQuery.isInitialLoading}
                    isError={helmReleaseQuery.isError}
                    release={helmReleaseQuery.data}
                    selectedRevision={selectedRevision}
                  />
                </WidgetBody>
              </div>
              <div className="w-80 hidden 2xl:!block">
                <HelmRevisionList
                  currentRevision={helmReleaseQuery.data?.version}
                  history={helmHistoryQuery.data}
                />
              </div>
            </div>
          </Widget>
        </div>
      </div>
    </>
  );
}

type HelmDetailsProps = {
  isLoading: boolean;
  isError: boolean;
  selectedRevision?: number;
  release?: HelmRelease;
};

function HelmDetails({
  isLoading,
  isError,
  release,
  selectedRevision,
}: HelmDetailsProps) {
  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <Alert color="error" title="Failed to load Helm application details" />
    );
  }

  if (!release || !selectedRevision) {
    return <Alert color="error" title="No Helm application details found" />;
  }

  return (
    <>
      <HelmSummary release={release} />
      <div className="my-6 h-[1px] w-full bg-gray-5 th-dark:bg-gray-7 th-highcontrast:bg-white" />
      <Card className="bg-inherit">
        <ReleaseTabs release={release} selectedRevision={selectedRevision} />
      </Card>
    </>
  );
}
