import { Meta } from '@storybook/react-webpack5';
import { useState } from 'react';
import { Server, Cloud } from 'lucide-react';

import { Icon } from '@@/Icon';

import { SortableListHeader } from './SortableListHeader';

export default {
  component: SortableListHeader,
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
  const [sortDesc, setSortDesc] = useState(false);

  const [value, setValue] = useState<{
    group: SortKey;
    groupValue: string | null;
  }>({
    group: 'name',
    groupValue: null,
  });
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <SortableListHeader
      sortDesc={sortDesc}
      value={value}
      onChange={(newValue) => {
        setSortDesc((prev) => (value.group === newValue.group ? !prev : false));
        setValue(newValue);
      }}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      sortOptions={[...sortOptions]}
      groupOptions={groupOptions}
      searchPlaceholder="Search environments..."
      data-cy="group-sort"
    />
  );
}

export function WithGroupFilter() {
  const [sortDesc, setSortDesc] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [value, setValue] = useState<{
    group: SortKey;
    groupValue: string | null;
  }>({
    group: 'group',
    groupValue: 'Production',
  });

  return (
    <SortableListHeader
      sortDesc={sortDesc}
      value={value}
      onChange={(newValue) => {
        setSortDesc((prev) => (value.group === newValue.group ? !prev : false));
        setValue(newValue);
      }}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      sortOptions={[...sortOptions]}
      groupOptions={groupOptions}
      searchPlaceholder="Search environments..."
      data-cy="group-sort"
    />
  );
}

export function WithActionButton() {
  const [sortDesc, setSortDesc] = useState(false);
  const [value, setValue] = useState<{
    group: SortKey;
    groupValue: string | null;
  }>({
    group: 'name',
    groupValue: null,
  });
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <SortableListHeader
      sortDesc={sortDesc}
      value={value}
      onChange={(newValue) => {
        setSortDesc((prev) => (value.group === newValue.group ? !prev : false));
        setValue(newValue);
      }}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      sortOptions={[...sortOptions]}
      groupOptions={groupOptions}
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
