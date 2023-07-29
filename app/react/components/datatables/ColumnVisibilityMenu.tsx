import _ from 'lodash';
import clsx from 'clsx';
import { Menu, MenuButton, MenuList } from '@reach/menu-button';
import { Columns } from 'lucide-react';
import { Column } from '@tanstack/react-table';

import { Checkbox } from '@@/form-components/Checkbox';

interface Props<D extends object> {
  columns: Column<D>[];
  onChange: (value: string[]) => void;
  value: string[];
}

export function ColumnVisibilityMenu<D extends object>({
  columns,
  onChange,
  value,
}: Props<D>) {
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
                {columns.map((column) => (
                  <div key={column.id}>
                    <Checkbox
                      checked={column.getIsVisible()}
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
    if (visible) {
      onChange(value.filter((id) => id !== colId));
      return;
    }

    onChange([...value, colId]);
  }
}
