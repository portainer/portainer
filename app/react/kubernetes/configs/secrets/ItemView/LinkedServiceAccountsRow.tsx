import { PencilIcon } from 'lucide-react';
import { useState } from 'react';
import { compact } from 'lodash';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useAuthorizations } from '@/react/hooks/useUser';
import { useGetAllServiceAccountsQuery } from '@/react/kubernetes/more-resources/ServiceAccountsView/ServiceAccountsDatatable/queries/useGetAllServiceAccountsQuery';
import {
  SAImagePullSecretsUpdate,
  useUpdateLinkedServiceAccountsMutation,
} from '@/react/kubernetes/configs/secrets/queries/useUpdateLinkedServiceAccountsMutation';

import { Badge } from '@@/Badge';
import { Button } from '@@/buttons/Button';
import { LoadingButton } from '@@/buttons/LoadingButton';
import { DetailsRow } from '@@/DetailsTable/DetailsRow';
import { Link } from '@@/Link';
import { MultiSelect } from '@@/form-components/PortainerSelect';
import {
  DisabledMultiValue,
  DisabledMultiValueRemove,
  DisabledOption,
  preserveProtectedValues,
} from '@@/form-components/DisabledMultiValue';
import { Tooltip } from '@@/Tip/Tooltip';
import { InlineLoader } from '@@/InlineLoader';

import { useSecretsLinkedToDefaultSA } from '../queries/useSecretsLinkedToDefaultSA';

const MAX_VISIBLE_SERVICE_ACCOUNTS = 5;

const registryAccessAdminMessage = (
  <span>
    This secret is linked to the default service account from the{' '}
    <Link to="kubernetes.registries" data-cy="registry-access-link">
      registry access
    </Link>{' '}
    settings to allow pods to pull images automatically in this namespace.
    Update the settings to remove the link.
  </span>
);

const registryAccessUserMessage = (
  <span>
    This secret is linked to the default service account from the registry
    access settings to allow pods to pull images automatically in this
    namespace. Contact your administrator to update the settings.
  </span>
);

type Props = {
  secretName: string;
  namespace: string;
  isSystem: boolean;
};

type ServiceAccount = {
  name: string;
  imagePullSecrets?: { name: string }[];
};

export function LinkedServiceAccountsRow({
  secretName,
  namespace,
  isSystem,
}: Props) {
  const environmentId = useEnvironmentId();
  const serviceAccountsQuery = useGetAllServiceAccountsQuery(environmentId);
  const allServiceAccounts = serviceAccountsQuery.data ?? [];

  const secretsBoundToDefaultSA = useSecretsLinkedToDefaultSA(namespace);
  const isSecretLinkedToDefaultSA =
    secretsBoundToDefaultSA.data?.includes(secretName);
  const isLoading =
    secretsBoundToDefaultSA.isLoading || serviceAccountsQuery.isLoading;

  const namespaceSAs: ServiceAccount[] = allServiceAccounts.filter(
    (sa) => sa.namespace === namespace
  );

  return (
    <DetailsRow
      ariaLabel="Linked service accounts"
      label={
        <span className="flex items-center">
          Linked service accounts
          <Tooltip message="Service accounts that use this secret as an image pull secret." />
        </span>
      }
    >
      {isLoading ? (
        <InlineLoader>Loading service accounts...</InlineLoader>
      ) : (
        <LinkedServiceAccountsContent
          secretName={secretName}
          namespace={namespace}
          isSystem={isSystem}
          namespaceSAs={namespaceSAs}
          isSecretLinkedToDefaultSA={isSecretLinkedToDefaultSA}
        />
      )}
    </DetailsRow>
  );
}

type LinkedServiceAccountsContentProps = {
  secretName: string;
  namespace: string;
  isSystem: boolean;
  namespaceSAs: ServiceAccount[];
  isSecretLinkedToDefaultSA?: boolean;
};

function LinkedServiceAccountsContent({
  secretName,
  namespace,
  isSystem,
  namespaceSAs,
  isSecretLinkedToDefaultSA,
}: LinkedServiceAccountsContentProps) {
  const environmentId = useEnvironmentId();
  const { authorized: canEdit } = useAuthorizations('K8sServiceAccountsW');
  const { authorized: canUpdateRegistryAccess } = useAuthorizations(
    'PortainerRegistryUpdateAccess'
  );
  const linkedSAsMutation =
    useUpdateLinkedServiceAccountsMutation(environmentId);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSANames, setSelectedSANames] = useState<string[]>([]);

  const linkedNames = namespaceSAs
    .filter((sa) => sa.imagePullSecrets?.some((s) => s.name === secretName))
    .map((sa) => sa.name);
  const protectedSANames =
    isSecretLinkedToDefaultSA && linkedNames.includes('default')
      ? ['default']
      : [];
  const registryDisabledMessage = canUpdateRegistryAccess
    ? registryAccessAdminMessage
    : registryAccessUserMessage;
  const saOptions: DisabledOption<string>[] = namespaceSAs.map((sa) => {
    const isProtected = isSecretLinkedToDefaultSA && sa.name === 'default';
    return {
      value: sa.name,
      label: sa.name,
      disabled: isProtected,
      disabledMessage: isProtected ? registryDisabledMessage : undefined,
    };
  });
  const visible = linkedNames.slice(0, MAX_VISIBLE_SERVICE_ACCOUNTS);
  const hidden = linkedNames.slice(MAX_VISIBLE_SERVICE_ACCOUNTS);

  return isEditing ? (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelect<string>
        value={selectedSANames}
        options={saOptions}
        onChange={(names) =>
          setSelectedSANames(preserveProtectedValues(names, protectedSANames))
        }
        placeholder="Select service accounts..."
        disabled={linkedSAsMutation.isLoading}
        data-cy="k8sSecretDetail-linkedSAs-select"
        components={{
          MultiValue: DisabledMultiValue,
          MultiValueRemove: DisabledMultiValueRemove,
        }}
      />
      <div className="inline-flex gap-2">
        <LoadingButton
          size="small"
          isLoading={linkedSAsMutation.isLoading}
          loadingText="Saving..."
          onClick={handleSave}
          data-cy="k8sSecretDetail-linkedSAs-save"
          // match the height of the portainer-select component
          className="h-[34px]"
        >
          Save
        </LoadingButton>
        <Button
          size="small"
          color="default"
          disabled={linkedSAsMutation.isLoading}
          onClick={() => setIsEditing(false)}
          data-cy="k8sSecretDetail-linkedSAs-cancel"
          // match the height of the portainer-select component
          className="h-[34px]"
        >
          Cancel
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      {visible.length > 0 ? (
        <div className="flex h-fit flex-wrap gap-2">
          {visible.map((saName) => (
            <Badge key={saName} type="info" className="min-w-max">
              <Link
                to="kubernetes.moreResources.serviceAccounts.serviceAccount"
                params={{ namespace, name: saName }}
                data-cy={`linked-service-account-link-${saName}`}
                className="!text-inherit"
              >
                {saName}
              </Link>
            </Badge>
          ))}
          {hidden.length > 0 && (
            <Badge type="muted" className="min-w-max cursor-default">
              + {hidden.length} more
            </Badge>
          )}
        </div>
      ) : (
        <span className="text-muted">
          No service accounts linked. Without a link, pods must specify this
          secret manually. Link to a{' '}
          <Link
            to="kubernetes.moreResources.serviceAccounts"
            data-cy="service-account-link"
          >
            service account
          </Link>{' '}
          so pods using it can pull images automatically - or link to the{' '}
          <code>default</code> service account to cover all pods in this
          namespace that don&apos;t specify one.
        </span>
      )}
      {canEdit && !isSystem && (
        <div>
          <Button
            color="light"
            size="small"
            icon={PencilIcon}
            onClick={() => {
              setSelectedSANames(linkedNames);
              setIsEditing(true);
            }}
            data-cy="k8sSecretDetail-linkedSAs-edit"
            // match the height of the portainer-select component
            className="h-[34px]"
          >
            Edit
          </Button>
        </div>
      )}
    </div>
  );

  function handleSave() {
    const previousSet = new Set(linkedNames);
    const nextSet = new Set(selectedSANames);

    const toAdd = selectedSANames.filter((n) => !previousSet.has(n));
    const toRemove = linkedNames.filter((n) => !nextSet.has(n));

    const updates: Array<SAImagePullSecretsUpdate | undefined> = [
      ...toAdd,
      ...toRemove,
    ].map((saName) => {
      const sa = namespaceSAs.find((s) => s.name === saName);
      if (!sa) {
        return undefined;
      }
      const currentSecrets = sa.imagePullSecrets?.map((s) => s.name) ?? [];
      const newSecrets = toAdd.includes(saName)
        ? [...new Set([...currentSecrets, secretName])]
        : currentSecrets.filter((s) => s !== secretName);
      return { saName, namespace, newSecrets };
    });

    linkedSAsMutation.mutate(compact(updates), {
      onSuccess: ({ rejectedItems }) => {
        if (rejectedItems.length === 0) {
          setIsEditing(false);
        }
      },
    });
  }
}
