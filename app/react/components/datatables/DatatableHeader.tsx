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
  description?: ReactNode;
};

export function DatatableHeader({
  onSearchChange,
  renderTableActions,
  renderTableSettings,
  searchValue,
  title,
  titleIcon,
  description,
}: Props) {
  if (!title) {
    return null;
  }

  return (
    <Table.Title label={title} icon={titleIcon} description={description}>
      <SearchBar value={searchValue} onChange={onSearchChange} />
      {renderTableActions && (
        <Table.Actions>{renderTableActions()}</Table.Actions>
      )}
      <Table.TitleActions>
        {!!renderTableSettings && renderTableSettings()}
      </Table.TitleActions>
    </Table.Title>
  );
}
