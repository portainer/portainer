import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { SystemBadge } from '@@/Badge/SystemBadge';
import { DetailsRow } from '@@/DetailsTable/DetailsRow';
import { DetailsTable } from '@@/DetailsTable/DetailsTable';
import { Link } from '@@/Link';
import { Tooltip } from '@@/Tip/Tooltip';
import { Widget, WidgetBody } from '@@/Widget';

import { useServiceAccount } from '../queries/useServiceAccount';

import { ImagePullSecretsRow } from './ImagePullSecretsRow';

type Props = { namespace: string; name: string };

export function ServiceAccountDetailsWidget({ namespace, name }: Props) {
  const environmentId = useEnvironmentId();
  const serviceAccountQuery = useServiceAccount(environmentId, namespace, name);
  const { data: serviceAccount } = serviceAccountQuery;
  const { isLoading } = serviceAccountQuery;

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetBody loading={isLoading}>
            <DetailsTable
              dataCy="k8sSADetail-table"
              className="[&_td:first-child]:w-2/5"
            >
              <DetailsRow label="Name">
                {serviceAccount?.name}
                {serviceAccount?.isSystem && <SystemBadge className="ml-1" />}
              </DetailsRow>
              <DetailsRow label="Namespace">
                <Link
                  to="kubernetes.resourcePools.resourcePool"
                  params={{ id: namespace }}
                  data-cy="namespace-link"
                >
                  {namespace}
                </Link>
                {serviceAccount?.isSystem && <SystemBadge className="ml-1" />}
              </DetailsRow>
              <DetailsRow label="Creation date">
                {serviceAccount?.creationDate
                  ? new Date(serviceAccount.creationDate).toLocaleString()
                  : '-'}
              </DetailsRow>
              <DetailsRow
                ariaLabel="Automount token"
                label={
                  <>
                    Automount token
                    <Tooltip message="Controls whether pods automatically receive an API token for cluster access. Disabling this reduces attack surface for workloads that don't need Kubernetes API access. Individual pods can still override this setting." />
                  </>
                }
              >
                <span className="flex items-center">
                  {serviceAccount?.automountServiceAccountToken === false
                    ? 'Disabled'
                    : 'Enabled'}
                </span>
              </DetailsRow>

              <ImagePullSecretsRow
                namespace={namespace}
                name={name}
                imagePullSecrets={serviceAccount?.imagePullSecrets ?? []}
                isSystem={serviceAccount?.isSystem}
              />
            </DetailsTable>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
