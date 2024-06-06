import _ from 'lodash';
import clsx from 'clsx';
import { Menu, MenuButton, MenuList } from '@reach/menu-button';
import { Columns } from 'lucide-react';
import { Table } from '@tanstack/react-table';

import { Checkbox } from '@@/form-components/Checkbox';

interface Props<D extends object> {
  onChange: (value: string[]) => void;
  value: string[];
  table: Table<D>;
}

export function ColumnVisibilityMenu<D extends object>({
  onChange,
  value,
  table,
}: Props<D>) {
  const columnsToHide = table.getAllColumns().filter((col) => col.getCanHide());
  if (!columnsToHide.length) {
    return null;
  }

  return (
    <Menu className="setting">
      {({ isExpanded }) => (
        <>
          <MenuButton
            className={clsx('table-setting-menu-btn', {
              'setting-active': isExpanded,
            })}
          >
            <Columns
              size="13"
              className="space-right"
              strokeWidth="3px"
              aria-hidden="true"
              aria-label="Columns"
            />
          </MenuButton>
          <MenuList>
            <div className="tableMenu">
              <div className="menuHeader">Show / Hide Columns</div>
              <div className="menuContent">
                {columnsToHide.map((column) => (
                  <div key={column.id}>
                    <Checkbox
                      checked={column.getIsVisible()}
                      data-cy="column-visibility-checkbox"
                      label={
                        typeof column.columnDef.header === 'string'
                          ? column.columnDef.header
                          : _.capitalize(column.columnDef.id)
                      }
                      id={`visibility_${column.id}`}
                      onChange={(e) =>
                        handleChangeColumnVisibility(
                          column.id,
                          e.target.checked
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </MenuList>
        </>
      )}
    </Menu>
  );

  function handleChangeColumnVisibility(colId: string, visible: boolean) {
    const newValue = visible
      ? value.filter((id) => id !== colId)
      : [...value, colId];

    table.setColumnVisibility(
      Object.fromEntries(newValue.map((col) => [col, false]))
    );
    onChange(newValue);
  }
}

export function getColumnVisibilityState(hiddenColumns: string[]) {
  return {
    columnVisibility: Object.fromEntries(
      hiddenColumns.map((col) => [col, false])
    ),
  };
}
