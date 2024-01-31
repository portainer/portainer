import Kube from '@/assets/ico/kube.svg?c';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { useAddonsQuery } from '@/react/kubernetes/cluster/microk8s/addons/addons.service';
import { useNodesQuery } from '@/react/kubernetes/cluster/HomeView/nodes.service';

import { Widget, WidgetTitle, WidgetBody } from '@@/Widget';
import { DetailsTable } from '@@/DetailsTable';
import { TextTip } from '@@/Tip/TextTip';
import { Link } from '@@/Link';

import { EnvironmentId } from '../types';

export function Microk8sClusterDetails({
  environmentId,
}: {
  environmentId: EnvironmentId;
}) {
  const { data: environment, ...environmentQuery } =
    useEnvironment(environmentId);
  const { data: addonResponse, ...addonsQuery } = useAddonsQuery(
    environmentId,
    environment?.Status
  );

  const { data: nodes, ...nodesQuery } = useNodesQuery(environmentId);
  const currentVersion = addonResponse?.currentVersion;
  const addonNames = addonResponse?.addons
    ?.filter((addon) => addon.status === 'enabled')
    .map((addon) => addon.name);

  if (environmentQuery.isError) {
    return <TextTip color="orange">Unable to load environment</TextTip>;
  }

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetTitle icon={Kube} title="MicroK8s cluster details" />
          <WidgetBody loading={addonsQuery.isLoading || nodesQuery.isLoading}>
            <DetailsTable dataCy="microk8s-cluster-details-table">
              <DetailsTable.Row label="Addons" colClassName="w-1/2">
                {addonsQuery.isError && 'Unable to get addons'}
                {!addonNames?.length &&
                  addonsQuery.isSuccess &&
                  'No addons installed'}
                {addonNames?.length && addonNames.join(', ')}
              </DetailsTable.Row>
              <DetailsTable.Row label="Kubernetes version" colClassName="w-1/2">
                {addonsQuery.isError && 'Unable to find kubernetes version'}
                {!!currentVersion && currentVersion}
              </DetailsTable.Row>
              <DetailsTable.Row label="Node count" colClassName="w-1/2">
                {nodesQuery.isError && 'Unable to get node count'}
                {nodes && nodes.length}
              </DetailsTable.Row>
            </DetailsTable>
            <TextTip color="blue">
              You can{' '}
              <Link
                to="kubernetes.cluster"
                params={{ endpointId: environmentId }}
                data-cy="cluster-details-view-link"
              >
                manage the cluster
              </Link>{' '}
              to upgrade, add/remove nodes or enable/disable addons.
            </TextTip>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
