import { Meta } from '@storybook/react-webpack5';
import { useState } from 'react';
import { Server, Cloud } from 'lucide-react';

import { Icon } from '@@/Icon';

import { DropdownMenu } from './DropdownMenu';

export default {
  component: DropdownMenu,
  title: 'Components/DropdownMenu',
} as Meta;

const options = [
  { key: 'Production', count: 12, icon: <Icon icon={Server} /> },
  { key: 'Staging', count: 5, icon: <Icon icon={Cloud} /> },
  { key: 'Development', count: 8 },
];

export function Interactive() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <DropdownMenu
      label="Group"
      options={options}
      selected={selected}
      onSelect={setSelected}
      data-cy="dropdown-menu"
    />
  );
}

export function WithBadge() {
  return (
    <DropdownMenu
      label="Group"
      options={options}
      selected="Production"
      onSelect={() => {}}
      badge="Production"
      data-cy="dropdown-menu-badge"
    />
  );
}

export function WithoutCounts() {
  return (
    <DropdownMenu
      label="Status"
      options={[{ key: 'Online' }, { key: 'Offline' }, { key: 'Unknown' }]}
      selected={null}
      onSelect={() => {}}
      data-cy="dropdown-menu-no-counts"
    />
  );
}
