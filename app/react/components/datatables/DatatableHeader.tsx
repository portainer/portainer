import { ReactNode } from 'react';

import { AutomationTestingProps } from '@/types';

import { IconProps } from '@@/Icon';

import { SearchBar } from './SearchBar';
import { Table } from './Table';

type Props = {
  title?: string;
  titleIcon?: IconProps['icon'];
  searchValue: string;
  onSearchChange(value: string): void;
  renderTableSettings?(): ReactNode;
  renderTableActions?(): ReactNode;
  description?: ReactNode;
  titleId?: string;
} & AutomationTestingProps;

export function DatatableHeader({
  onSearchChange,
  renderTableActions,
  renderTableSettings,
  searchValue,
  title,
  titleIcon,
  description,
  titleId,
  'data-cy': dataCy,
}: Props) {
  if (!title) {
    return null;
  }

  const searchBar = (
    <SearchBar
      value={searchValue}
      onChange={onSearchChange}
      data-cy={`${dataCy}-search-input`}
    />
  );
  const tableActions = !!renderTableActions && (
    <Table.Actions>{renderTableActions()}</Table.Actions>
  );
  const tableTitleSettings = !!renderTableSettings && (
    <Table.TitleActions>{renderTableSettings()}</Table.TitleActions>
  );

  return (
    <Table.Title
      id={titleId}
      label={title}
      icon={titleIcon}
      description={description}
      data-cy={dataCy}
    >
      {searchBar}
      {tableActions}
      {tableTitleSettings}
    </Table.Title>
  );
}
