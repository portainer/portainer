import { KubernetesSecretTypeOptions } from '@/kubernetes/models/configuration/models';

import { SystemBadge } from '@@/Badge/SystemBadge';
import { DetailsRow } from '@@/DetailsTable/DetailsRow';
import { DetailsTable } from '@@/DetailsTable/DetailsTable';
import { Link } from '@@/Link';
import { Tooltip } from '@@/Tip/Tooltip';

import { RegistryBadge } from '../RegistryBadge';

import { LinkedServiceAccountsRow } from './LinkedServiceAccountsRow';

type Props = {
  name: string;
  namespace: string;
  secretTypeLabel: string;
  // Passed from Angular as ctrl.isSystemNamespace() — true when the namespace is a system namespace
  isSystem: boolean;
  // Angular passes annotation values as strings; accept both and parse internally
  registryId?: number | string;
};

export function SecretDetailsTable({
  name,
  namespace,
  secretTypeLabel,
  isSystem,
  registryId,
}: Props) {
  const parsedRegistryId =
    registryId !== undefined && registryId !== ''
      ? parseInt(String(registryId), 10) || undefined
      : undefined;
  const supportsImagePullSecrets = isImagePullSecretSecretType(secretTypeLabel);

  return (
    <DetailsTable
      dataCy="k8sConfigDetail-configTable"
      className="[&_td:first-child]:w-2/5"
    >
      <DetailsRow label="Name">
        {name} {isSystem && <SystemBadge />}
      </DetailsRow>
      <DetailsRow label="Namespace">
        <Link
          to="kubernetes.resourcePools.resourcePool"
          params={{ id: namespace }}
          data-cy={`namespace-link-${namespace}`}
        >
          {namespace}
        </Link>{' '}
        {isSystem && <SystemBadge />}
      </DetailsRow>
      {secretTypeLabel && (
        <DetailsRow label="Secret Type">{secretTypeLabel}</DetailsRow>
      )}
      {parsedRegistryId && (
        <DetailsRow label="Registry">
          <RegistryBadge registryId={parsedRegistryId}>
            <Tooltip message="This registry secret was created by Portainer to allow pulling images. Manually editing this secret is disabled." />
          </RegistryBadge>
        </DetailsRow>
      )}
      {supportsImagePullSecrets && (
        <LinkedServiceAccountsRow
          secretName={name}
          namespace={namespace}
          isSystem={isSystem}
        />
      )}
    </DetailsTable>
  );
}

const IMAGE_PULL_SECRET_TYPES = new Set(
  [
    KubernetesSecretTypeOptions.DOCKERCFG.name,
    KubernetesSecretTypeOptions.DOCKERCFG.value,
    KubernetesSecretTypeOptions.DOCKERCONFIGJSON.name,
    KubernetesSecretTypeOptions.DOCKERCONFIGJSON.value,
  ].map((type) => type.toLowerCase())
);

function isImagePullSecretSecretType(secretTypeLabel: string) {
  return IMAGE_PULL_SECRET_TYPES.has(secretTypeLabel.toLowerCase());
}
