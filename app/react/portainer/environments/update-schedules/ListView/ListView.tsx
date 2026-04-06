import { Clock } from 'lucide-react';
import { useMemo } from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

import { notifySuccess } from '@/portainer/services/notifications';
import { withLimitToBE } from '@/react/hooks/useLimitToBE';
import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';
import i18n from '@/i18n';

import { Datatable } from '@@/datatables';
import { PageHeader } from '@@/PageHeader';
import { AddButton } from '@@/buttons';
import { useTableState } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { useList } from '../queries/list';
import { EdgeUpdateSchedule, StatusType } from '../types';
import { useRemoveMutation } from '../queries/useRemoveMutation';
import { BetaAlert } from '../common/BetaAlert';

import { columns } from './columns';
import { createStore } from './datatable-store';
import { DecoratedItem } from './types';

const storageKey = 'update-schedules-list';
const settingsStore = createStore(storageKey);

export default withLimitToBE(ListView);

export function ListView() {
  const { t } = useTranslation();
  const tableState = useTableState(settingsStore, storageKey);

  const listQuery = useList(true);
  const groupsQuery = useEdgeGroups({
    select: (groups) => Object.fromEntries(groups.map((g) => [g.Id, g.Name])),
  });

  const items: Array<DecoratedItem> = useMemo(() => {
    if (!listQuery.data || !groupsQuery.data) {
      return [];
    }

    return listQuery.data.map((item) => ({
      ...item,
      edgeGroupNames: _.compact(
        item.edgeGroupIds.map((id) => groupsQuery.data[id])
      ),
    }));
  }, [listQuery.data, groupsQuery.data]);

  if (!listQuery.data || !groupsQuery.data) {
    return null;
  }

  return (
    <>
      <PageHeader
        title={t('portainer.schedules.update_rollback_title')}
        breadcrumbs={t('portainer.schedules.update_rollback_breadcrumb')}
        reload
      />

      <BetaAlert
        className="mb-2 ml-[15px]"
        message={t('portainer.schedules.beta_message')}
      />

      <Datatable
        dataset={items}
        columns={columns}
        settingsManager={tableState}
        title={t('portainer.schedules.update_rollback_datatable')}
        titleIcon={Clock}
        isLoading={listQuery.isLoading}
        renderTableActions={(selectedRows) => (
          <TableActions selectedRows={selectedRows} />
        )}
        isRowSelectable={(row) => row.original.status === StatusType.Pending}
        data-cy="environment-update-schedules-datatable"
      />
    </>
  );
}

function TableActions({
  selectedRows,
}: {
  selectedRows: EdgeUpdateSchedule[];
}) {
  const { t } = useTranslation();
  const removeMutation = useRemoveMutation();
  return (
    <>
      <DeleteButton
        onConfirmed={() => handleRemove()}
        disabled={selectedRows.length === 0}
        data-cy="remove-update-schedules-button"
        confirmMessage={t('portainer.schedules.remove_confirm')}
      />
      <AddButton to=".create" data-cy="add-update-schedules-button">
        {t('portainer.schedules.add_schedule')}
      </AddButton>
    </>
  );

  async function handleRemove() {
    removeMutation.mutate(selectedRows, {
      onSuccess: () => {
        notifySuccess(i18n.t('common.success'), i18n.t('portainer.schedules.remove_success'));
      },
    });
  }
}
