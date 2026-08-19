import { ConfigMap } from 'kubernetes-types/core/v1';
import { concat, without } from 'lodash';

import { PortainerNamespaceAccessesConfigMap } from '@/react/kubernetes/configs/constants';
import { Configuration } from '@/react/kubernetes/configs/types';

import { NamespaceAccess } from './types';

export function createAuthorizeAccessConfigMapPayload(
  namespaceAccesses: NamespaceAccess[],
  selectedItems: NamespaceAccess[],
  namespaceName: string,
  configMap?: Configuration
): ConfigMap {
  const newRemainingAccesses = concat(namespaceAccesses, ...selectedItems);
  return createAccessConfigMapPayload(
    newRemainingAccesses,
    namespaceName,
    configMap
  );
}

export function createUnauthorizeAccessConfigMapPayload(
  namespaceAccesses: NamespaceAccess[],
  selectedItems: NamespaceAccess[],
  namespaceName: string,
  configMap?: Configuration
): ConfigMap {
  const newRemainingAccesses = without(namespaceAccesses, ...selectedItems);
  return createAccessConfigMapPayload(
    newRemainingAccesses,
    namespaceName,
    configMap
  );
}

function createAccessConfigMapPayload(
  newRemainingAccesses: NamespaceAccess[],
  namespaceName: string,
  configMap?: Configuration
): ConfigMap {
  const configMapAccessesValue = JSON.parse(
    configMap?.Data?.[PortainerNamespaceAccessesConfigMap.accessKey] || '{}'
  );
  const newNamespaceAccesses = newRemainingAccesses.reduce(
    (namespaceAccesses, accessItem) => {
      if (accessItem.type === 'user') {
        return {
          ...namespaceAccesses,
          UserAccessPolicies: {
            ...namespaceAccesses.UserAccessPolicies,
            // hardcode to 0, as they use their environment role
            [`${accessItem.id}`]: { RoleId: 0 },
          },
        };
      }
      return {
        ...namespaceAccesses,
        TeamAccessPolicies: {
          ...namespaceAccesses.TeamAccessPolicies,
          // hardcode to 0, as they use their environment role
          [`${accessItem.id}`]: { RoleId: 0 },
        },
      };
    },
    {
      UserAccessPolicies: {},
      TeamAccessPolicies: {},
    }
  );
  const newConfigMapAccessesValue = {
    ...configMapAccessesValue,
    [namespaceName]: newNamespaceAccesses,
  };
  const updatedConfigMap: ConfigMap = {
    metadata: {
      name: PortainerNamespaceAccessesConfigMap.configMapName,
      namespace: PortainerNamespaceAccessesConfigMap.namespace,
      uid: configMap?.UID,
    },
    data: {
      ...configMap?.Data,
      [PortainerNamespaceAccessesConfigMap.accessKey]: JSON.stringify(
        newConfigMapAccessesValue
      ),
    },
  };

  return updatedConfigMap;
}
