import clsx from 'clsx';
import { useMemo } from 'react';
import { Menu, MenuButton, MenuPopover } from '@reach/menu-button';
import { ColumnInstance } from 'react-table';

export const DefaultFilter = filterHOC('Filter by state');

interface MultipleSelectionFilterProps {
  options: string[];
  value: string[];
  filterKey: string;
  onChange: (value: string[]) => void;
  menuTitle?: string;
}

export function MultipleSelectionFilter({
  options,
  value = [],
  filterKey,
  onChange,
  menuTitle = 'Filter by state',
}: MultipleSelectionFilterProps) {
  const enabled = value.length > 0;
  return (
    <div>
      <Menu>
        <MenuButton
          className={clsx('table-filter', { 'filter-active': enabled })}
        >
          Filter
          <i
            className={clsx(
              'fa',
              'space-left',
              enabled ? 'fa-check' : 'fa-filter'
            )}
            aria-hidden="true"
          />
        </MenuButton>
        <MenuPopover className="dropdown-menu">
          <div className="tableMenu">
            <div className="menuHeader">{menuTitle}</div>
            <div className="menuContent">
              {options.map((option, index) => (
                <div className="md-checkbox" key={index}>
                  <input
                    id={`filter_${filterKey}_${index}`}
                    type="checkbox"
                    checked={value.includes(option)}
                    onChange={() => handleChange(option)}
                  />
                  <label htmlFor={`filter_${filterKey}_${index}`}>
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </MenuPopover>
      </Menu>
    </div>
  );

  function handleChange(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((o) => o !== option));

      return;
    }

    onChange([...value, option]);
  }
}

export function filterHOC(menuTitle: string) {
  return function Filter({
    column: { filterValue, setFilter, preFilteredRows, id },
  }: {
    column: ColumnInstance;
  }) {
    const options = useMemo(() => {
      const options = new Set<string>();
      preFilteredRows.forEach((row) => {
        options.add(row.values[id]);
      });
      return Array.from(options);
    }, [id, preFilteredRows]);
    return (
      <MultipleSelectionFilter
        options={options}
        filterKey={id}
        value={filterValue}
        onChange={setFilter}
        menuTitle={menuTitle}
      />
    );
  };
}
