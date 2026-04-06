import { CellContext } from '@tanstack/react-table';

import i18n from '@/i18n';
import { useCurrentUser } from '@/react/hooks/useUser';

import { Link } from '@@/Link';

import { DecoratedUser } from '../types';

import { helper } from './helper';

export const name = helper.accessor('Username', {
  header: i18n.t('users.col_name'),
  cell: Cell,
});

function Cell({
  getValue,
  row: { original: item },
}: CellContext<DecoratedUser, 'string'>) {
  const { isPureAdmin } = useCurrentUser();
  const name = getValue();

  if (!isPureAdmin) {
    return <>{name}</>;
  }

  return (
    <Link
      to=".user"
      params={{ id: item.Id }}
      data-cy={`user-link-${item.Username}`}
    >
      {name}
    </Link>
  );
}
