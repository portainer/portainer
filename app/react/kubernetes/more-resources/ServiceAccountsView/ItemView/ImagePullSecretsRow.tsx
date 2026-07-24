import { useMemo, useState } from 'react';
import { Secret } from 'kubernetes-types/core/v1';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useAuthorizations } from '@/react/hooks/useUser';
import { useSecrets } from '@/react/kubernetes/configs/queries/useSecrets';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';
import { Registry } from '@/react/portainer/registries/types/registry';

import { DetailsRow } from '@@/DetailsTable/DetailsRow';
import { InlineLoader } from '@@/InlineLoader';
import { Link } from '@@/Link';
import { DisabledOption } from '@@/form-components/DisabledMultiValue';
import { Tooltip } from '@@/Tip/Tooltip';

import { useUpdateServiceAccountImagePullSecretsMutation } from '../queries/useUpdateServiceAccountImagePullSecretsMutation';

import { ImagePullSecretsEditor } from './ImagePullSecretsEditor';
import { ImagePullSecretsList } from './ImagePullSecretsList';

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

type ImagePullSecretName = { name: string };

type Props = {
  namespace: string;
  name: string;
  imagePullSecrets: ImagePullSecretName[];
  isSystem?: boolean;
};

export function ImagePullSecretsRow({
  namespace,
  name,
  imagePullSecrets,
  isSystem,
}: Props) {
  const isDefaultServiceAccount = name === 'default';
  const environmentId = useEnvironmentId();
  const secretsQuery = useSecrets(environmentId, namespace);
  const secrets = secretsQuery.data ?? [];
  const { authorized: canEdit } = useAuthorizations('K8sServiceAccountsW');
  const { authorized: canUpdateRegistryAccess } = useAuthorizations(
    'PortainerRegistryUpdateAccess'
  );
  const updateMutation =
    useUpdateServiceAccountImagePullSecretsMutation(environmentId);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  const {
    currentNames,
    protectedSecretNames,
    secretOptions,
    registryBySecretName,
    isRegistryDataLoading,
  } = useImagePullSecretsState({
    environmentId,
    namespace,
    imagePullSecrets,
    isDefaultServiceAccount,
    secrets,
    canUpdateRegistryAccess,
  });
  const pullSecretDetails = linkImagePullSecretsToSecrets(
    secrets,
    imagePullSecrets,
    registryBySecretName
  );
  const isLoading = secretsQuery.isLoading || isRegistryDataLoading;

  return (
    <DetailsRow
      ariaLabel="Image pull secrets"
      label={
        <span className="flex items-center">
          Image pull secrets
          <Tooltip
            message={
              name === 'default' ? (
                <>
                  <code>imagePullSecrets</code> from this &apos;default&apos;
                  service account apply to all <strong>pods</strong> without an
                  explicit service account in this namespace.
                </>
              ) : (
                <>
                  These <code>imagePullSecrets</code> are inherited by pods
                  using this service account.
                </>
              )
            }
          />
        </span>
      }
    >
      {isLoading ? (
        <InlineLoader size="xs">Loading image pull secrets...</InlineLoader>
      ) : isEditing ? (
        <ImagePullSecretsEditor
          selectedNames={selectedNames}
          secretOptions={secretOptions}
          protectedSecretNames={protectedSecretNames}
          isSaving={updateMutation.isLoading}
          onChange={setSelectedNames}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <ImagePullSecretsList
          imagePullSecrets={pullSecretDetails}
          namespace={namespace}
          isDefaultServiceAccount={isDefaultServiceAccount}
          canEdit={canEdit}
          isSystem={isSystem}
          onEdit={handleEdit}
        />
      )}
    </DetailsRow>
  );

  function handleEdit() {
    setSelectedNames(currentNames);
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
  }

  function handleSave() {
    updateMutation.mutate(
      { environmentId, namespace, name, secretNames: selectedNames },
      { onSuccess: () => setIsEditing(false) }
    );
  }
}

function linkImagePullSecretsToSecrets(
  secrets: Secret[],
  secretNames: { name: string }[],
  registryBySecretName: Record<string, Registry>
) {
  return secretNames.map(({ name }) => {
    const secret = secrets.find((s) => s.metadata?.name === name);
    return { name, secret, registry: registryBySecretName[name] };
  });
}

type UseImagePullSecretsStateArgs = {
  environmentId: number;
  namespace: string;
  imagePullSecrets: ImagePullSecretName[];
  isDefaultServiceAccount: boolean;
  secrets: Secret[];
  canUpdateRegistryAccess: boolean;
};

/**
 * Builds the derived state needed by the list and inline editor.
 * For the default service account, secrets managed by registry access stay
 * visible but non-removable here because they are configured elsewhere.
 */
function useImagePullSecretsState({
  environmentId,
  namespace,
  imagePullSecrets,
  isDefaultServiceAccount,
  secrets,
  canUpdateRegistryAccess,
}: UseImagePullSecretsStateArgs) {
  const registryData = useImagePullSecretRegistryData(environmentId, namespace);

  return useMemo(() => {
    const currentNames = imagePullSecrets.map(({ name }) => name);
    const linkedDefaultSecretNamesSet = new Set(
      isDefaultServiceAccount ? registryData.linkedDefaultSecretNames : []
    );
    const protectedSecretNames = currentNames.filter((secretName) =>
      linkedDefaultSecretNamesSet.has(secretName)
    );
    const registryDisabledMessage = canUpdateRegistryAccess
      ? registryAccessAdminMessage
      : registryAccessUserMessage;
    const secretOptions: DisabledOption<string>[] = secrets
      .map((secret) => secret.metadata?.name ?? '')
      .filter(Boolean)
      .map((name) => {
        const isProtected =
          isDefaultServiceAccount && linkedDefaultSecretNamesSet.has(name);

        return {
          value: name,
          label: name,
          disabled: isProtected,
          disabledMessage: isProtected ? registryDisabledMessage : undefined,
        };
      });

    return {
      currentNames,
      protectedSecretNames,
      secretOptions,
      registryBySecretName: registryData.registryBySecretName,
      isRegistryDataLoading: registryData.isLoading,
    };
  }, [
    canUpdateRegistryAccess,
    imagePullSecrets,
    isDefaultServiceAccount,
    registryData.isLoading,
    registryData.linkedDefaultSecretNames,
    registryData.registryBySecretName,
    secrets,
  ]);
}

type ImagePullSecretRegistryState = {
  linkedDefaultSecretNames: string[];
  registryBySecretName: Record<string, Registry>;
};

const emptyRegistryState: ImagePullSecretRegistryState = {
  linkedDefaultSecretNames: [],
  registryBySecretName: {},
};

function useImagePullSecretRegistryData(
  environmentId: number,
  namespace: string
) {
  const registryStateQuery = useEnvironmentRegistries(environmentId, {
    select: (registries) =>
      selectImagePullSecretRegistryState(registries, environmentId, namespace),
  });

  return {
    ...emptyRegistryState,
    ...registryStateQuery.data,
    isLoading: registryStateQuery.isLoading,
  };
}

function selectImagePullSecretRegistryState(
  registries: Registry[],
  environmentId: number,
  namespace: string
): ImagePullSecretRegistryState {
  return registries.reduce<ImagePullSecretRegistryState>((state, registry) => {
    const secretName = getRegistrySecretName(registry.Id);
    const isLinkedToDefaultSA =
      registry.RegistryAccesses?.[environmentId]?.Namespaces?.includes(
        namespace
      );

    return {
      linkedDefaultSecretNames: isLinkedToDefaultSA
        ? [...state.linkedDefaultSecretNames, secretName]
        : state.linkedDefaultSecretNames,
      registryBySecretName: {
        ...state.registryBySecretName,
        [secretName]: registry,
      },
    };
  }, emptyRegistryState);
}

function getRegistrySecretName(registryId: Registry['Id']) {
  // Registry access creates image pull secrets using this generated name.
  return `registry-${registryId}`;
}
