import { Meta } from '@storybook/react';
import { useState } from 'react';
import { Server, Cloud } from 'lucide-react';

import { Icon } from '@@/Icon';

import { GroupSortTableHeader } from './GroupSortTableHeader';

export default {
  component: GroupSortTableHeader,
  title: 'Components/Tables/GroupSortTableHeader',
} as Meta;

const groupOptions = {
  group: [
    { key: 'Production', count: 12, icon: <Icon icon={Server} /> },
    { key: 'Staging', count: 5, icon: <Icon icon={Cloud} /> },
    { key: 'Development', count: 8 },
  ],
};

const sortOptions = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'group', label: 'Group', grouped: true },
] as const;

type SortKey = (typeof sortOptions)[number]['key'];

export function Interactive() {
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  function handleSortChange(key: SortKey) {
    setSortDesc((prev) => (sortBy === key ? !prev : false));
    setSortBy(key);
  }

  return (
    <GroupSortTableHeader
      sortBy={sortBy}
      sortDesc={sortDesc}
      onSortChange={handleSortChange}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      sortOptions={[...sortOptions]}
      groupOptions={groupOptions}
      groupFilter={groupFilter}
      onGroupFilterChange={setGroupFilter}
      searchPlaceholder="Search environments..."
      data-cy="group-sort"
    />
  );
}

export function WithGroupFilter() {
  const [sortBy, setSortBy] = useState<SortKey>('group');
  const [sortDesc, setSortDesc] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  function handleSortChange(key: SortKey) {
    setSortDesc((prev) => (sortBy === key ? !prev : false));
    setSortBy(key);
  }

  return (
    <GroupSortTableHeader
      sortBy={sortBy}
      sortDesc={sortDesc}
      onSortChange={handleSortChange}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      sortOptions={[...sortOptions]}
      groupOptions={groupOptions}
      groupFilter="Production"
      onGroupFilterChange={() => {}}
      searchPlaceholder="Search environments..."
      data-cy="group-sort"
    />
  );
}

export function WithActionButton() {
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  function handleSortChange(key: SortKey) {
    setSortDesc((prev) => (sortBy === key ? !prev : false));
    setSortBy(key);
  }

  return (
    <GroupSortTableHeader
      sortBy={sortBy}
      sortDesc={sortDesc}
      onSortChange={handleSortChange}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      sortOptions={[...sortOptions]}
      groupOptions={groupOptions}
      groupFilter={groupFilter}
      onGroupFilterChange={setGroupFilter}
      actionButton={
        <button
          type="button"
          className="rounded bg-blue-8 px-3 py-1.5 text-sm text-white"
        >
          Add environment
        </button>
      }
      data-cy="group-sort"
    />
  );
}
