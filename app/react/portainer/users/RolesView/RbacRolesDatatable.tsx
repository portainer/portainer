import { FileCode } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import _ from 'lodash';

import { RoleTypes } from '@/portainer/rbac/models/role';

import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { BEFeatureIndicator } from '@@/BEFeatureIndicator';

import { isBE } from '../../feature-flags/feature-flags.service';
import { FeatureId } from '../../feature-flags/enums';

import { RbacRole } from './types';

const tableKey = 'rbac-roles-table';

const store = createPersistedStore(tableKey);

const columns = getColumns();

export function RbacRolesDatatable({
  dataset,
}: {
  dataset: Array<RbacRole> | undefined;
}) {
  const tableState = useTableState(store, tableKey);

  return (
    <Datatable
      title="Roles"
      titleIcon={FileCode}
      dataset={dataset || []}
      columns={columns}
      isLoading={!dataset}
      settingsManager={tableState}
      disableSelect
      data-cy="rbac-roles-datatable"
    />
  );
}

function getColumns() {
  const columnHelper = createColumnHelper<RbacRole>();

  return _.compact([
    columnHelper.accessor('Name', {
      header: 'Name',
    }),
    columnHelper.accessor('Description', {
      header: 'Description',
    }),
    !isBE &&
      columnHelper.display({
        id: 'be-indicator',
        cell: ({ row: { original: item } }) =>
          item.Id === RoleTypes.STANDARD ? (
            <b>Default</b>
          ) : (
            <BEFeatureIndicator featureId={FeatureId.RBAC_ROLES} />
          ),
        meta: {
          className: 'text-center',
        },
      }),
  ]);
}
