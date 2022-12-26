import { Authorized } from '@/react/hooks/useUser';
import KubernetesNamespaceHelper from '@/kubernetes/helpers/namespaceHelper';

import { columnHelper } from './helper';

export const name = columnHelper.accessor('Name', {
  header: 'Name',
  id: 'name',
  cell: ({ row, getValue }) => {
    const name = getValue();
    const isSystem = KubernetesNamespaceHelper.isSystemNamespace(
      row.original.Namespace
    );

    const isExternal =
      !row.original.Labels ||
      !row.original.Labels['io.portainer.kubernetes.application.owner'];

    return (
      <Authorized authorizations="K8sServiceW" childrenUnauthorized={name}>
        {name}

        {isSystem && (
          <span className="label label-info image-tag label-margins">
            system
          </span>
        )}

        {isExternal && !isSystem && (
          <span className="label label-primary image-tag label-margins">
            external
          </span>
        )}
      </Authorized>
    );
  },
});
