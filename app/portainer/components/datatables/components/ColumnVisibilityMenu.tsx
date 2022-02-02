import clsx from 'clsx';
import { Menu, MenuButton, MenuList } from '@reach/menu-button';
import { ColumnInstance } from 'react-table';

import { Checkbox } from '@/portainer/components/form-components/Checkbox';

import { useTableContext } from './TableContainer';

interface Props<D extends object> {
  columns: ColumnInstance<D>[];
  onChange: (value: string[]) => void;
  value: string[];
}

export function ColumnVisibilityMenu<D extends object>({
  columns,
  onChange,
  value,
}: Props<D>) {
  useTableContext();

  return (
    <Menu className="setting">
      {({ isExpanded }) => (
        <>
          <MenuButton
            className={clsx('table-setting-menu-btn', {
              'setting-active': isExpanded,
            })}
          >
            <i className="fa fa-columns" aria-hidden="true" /> Columns
          </MenuButton>
          <MenuList>
            <div className="tableMenu">
              <div className="menuHeader">Show / Hide Columns</div>
              <div className="menuContent">
                {columns.map((column) => (
                  <div key={column.id}>
                    <Checkbox
                      checked={column.isVisible}
                      label={column.Header as string}
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
