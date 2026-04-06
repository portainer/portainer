import { FileCode } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

import i18n from '@/i18n';
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
  const { t } = useTranslation();

  return (
    <Datatable
      title={t('roles.roles')}
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
      header: i18n.t('common.name') as string,
    }),
    columnHelper.accessor('Description', {
      header: i18n.t('portainer_groups.description') as string,
    }),
    !isBE &&
      columnHelper.display({
        id: 'be-indicator',
        cell: ({ row: { original: item } }) =>
          item.Id === RoleTypes.STANDARD ? (
            <b>{i18n.t('roles.default')}</b>
          ) : (
            <BEFeatureIndicator featureId={FeatureId.RBAC_ROLES} />
          ),
        meta: {
          className: 'text-center',
        },
      }),
  ]);
}
