import { User, UserPlus } from 'lucide-react';

import i18n from '@/i18n';
import { isEdgeAdmin } from '@/portainer/users/user.helpers';
import { RoleNames } from '@/portainer/users/types';

import { Icon } from '@@/Icon';

import { helper } from './helper';

export const role = helper.accessor(
  (item) =>
    `${RoleNames[item.Role]} ${
      item.isTeamLeader ? i18n.t('users.team_leader_suffix') : ''
    }`.trim(),
  {
    header: i18n.t('users.col_role') as string,
    cell: ({ getValue, row: { original: item } }) => {
      const icon =
        isEdgeAdmin({ Role: item.Role }) || item.isTeamLeader ? User : UserPlus;

      return (
        <span className="vertical-center">
          <Icon icon={icon} />
          {getValue() || '-'}
        </span>
      );
    },
  }
);
