import { PlusCircle } from 'lucide-react';
import { CellContext, ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import { User } from '@/portainer/users/types';
import { notifySuccess } from '@/portainer/services/notifications';
import { useAddMemberMutation } from '@/react/portainer/users/teams/queries';

import { Button } from '@@/buttons';

import { useRowContext } from './RowContext';

export const name: ColumnDef<User, string> = {
  header: NameHeader,
  accessorFn: (row) => row.Username,
  id: 'name',
  cell: NameCell,
};

function NameHeader() {
  const { t } = useTranslation();
  return <>{t('common.name')}</>;
}

export function NameCell({
  getValue,
  row: { original: user },
}: CellContext<User, string>) {
  const name = getValue();
  const { t } = useTranslation();
  const { disabled, teamId } = useRowContext();

  const addMemberMutation = useAddMemberMutation(teamId);

  return (
    <>
      {name}

      <Button
        color="link"
        data-cy={`add-member-${user.Username}`}
        className="space-left nopadding"
        disabled={disabled}
        icon={PlusCircle}
        onClick={() => handleAddMember()}
      >
        {t('teams_name_col.add')}
      </Button>
    </>
  );

  function handleAddMember() {
    addMemberMutation.mutate([user.Id], {
      onSuccess() {
        notifySuccess(t('teams_name_col.user_added'), name);
      },
    });
  }
}
