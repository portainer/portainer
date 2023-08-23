import { ReactNode } from 'react';

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
  renderRightSide?(
    searchBar: ReactNode,
    tableActions: ReactNode,
    tableTitleSettings: ReactNode
  ): ReactNode;
  description?: ReactNode;
};

export function DatatableHeader({
  onSearchChange,
  renderTableActions,
  renderTableSettings,
  renderRightSide = (searchBar, tableActions, tableTitleSettings) => (
    <>
      {searchBar}
      {tableActions}
      {tableTitleSettings}
    </>
  ),
  searchValue,
  title,
  titleIcon,
  description,
}: Props) {
  if (!title) {
    return null;
  }

  const searchBar = <SearchBar value={searchValue} onChange={onSearchChange} />;
  const tableActions = !!renderTableActions && (
    <Table.Actions>{renderTableActions()}</Table.Actions>
  );
  const tableTitleSettings = !!renderTableSettings && (
    <Table.TitleActions>{renderTableSettings()}</Table.TitleActions>
  );

  return (
    <Table.Title label={title} icon={titleIcon} description={description}>
      {renderRightSide(searchBar, tableActions, tableTitleSettings)}
    </Table.Title>
  );
}
