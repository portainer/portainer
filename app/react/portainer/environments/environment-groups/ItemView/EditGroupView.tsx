import { useMemo, useState } from 'react';
import { Box } from 'lucide-react';
import { useRouter } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';
import { useIdParam } from '@/react/hooks/useIdParam';

import { PageHeader } from '@@/PageHeader';
import { Tab, WidgetTabs, useCurrentTabIndex } from '@@/Widget/WidgetTabs';
import { confirm } from '@@/modals/confirm';
import { ModalType } from '@@/modals/Modal';
import { buildConfirmButton } from '@@/modals/utils';

import { useGroup } from '../queries/useGroup';
import { useDeleteEnvironmentGroupMutation } from '../queries/useDeleteEnvironmentGroupMutation';

import { EnvironmentsTab } from './tabs/EnvironmentsTab';
import { GroupHeader } from './GroupHeader';

export function EditGroupView() {
  const router = useRouter();
  const groupId = useIdParam();
  const deleteMutation = useDeleteEnvironmentGroupMutation();
  const [addEnvsDrawerOpen, setAddEnvsDrawerOpen] = useState(false);
  const groupQuery = useGroup(
    deleteMutation.isLoading || deleteMutation.isSuccess ? undefined : groupId,
    { size: true }
  );
  const group = groupQuery.data;
  const groupName = group?.Name ?? 'Environment group';

  async function handleDeleteGroup() {
    const confirmed = await confirm({
      title: 'Delete Environment Group',
      modalType: ModalType.Destructive,
      message: `Are you sure you want to delete the environment group "${groupName}"? This action cannot be undone.`,
      confirmButton: buildConfirmButton('Delete', 'danger'),
    });

    if (confirmed) {
      deleteMutation.mutate(groupId, {
        onSuccess() {
          notifySuccess('Success', 'Environment group deleted');
          router.stateService.go('portainer.groups');
        },
      });
    }
  }

  const tabs: Array<Tab> = useMemo(
    () => [
      {
        name: 'Environments',
        icon: Box,
        widget: (
          <EnvironmentsTab
            externalDrawerOpen={addEnvsDrawerOpen}
            onExternalDrawerClose={() => setAddEnvsDrawerOpen(false)}
          />
        ),
        selectedTabParam: 'environments',
      },
    ],
    [addEnvsDrawerOpen]
  );

  const currentTabIndex = useCurrentTabIndex(tabs);

  return (
    <>
      <PageHeader
        title={groupName}
        breadcrumbs={[{ label: 'Groups', link: 'portainer.groups' }, groupName]}
      />
      <div className="mx-4 space-y-4">
        <GroupHeader
          group={group}
          isLoading={groupQuery.isLoading}
          onRefresh={() => groupQuery.refetch()}
          onAddEnvironments={() => setAddEnvsDrawerOpen(true)}
          onDelete={handleDeleteGroup}
        />
        <WidgetTabs
          tabs={tabs}
          currentTabIndex={currentTabIndex}
          useContainer={false}
        />
      </div>
      {tabs[currentTabIndex].widget}
    </>
  );
}
