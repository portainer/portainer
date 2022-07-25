import clsx from 'clsx';
import { useMemo } from 'react';
import { Menu, MenuButton, MenuPopover } from '@reach/menu-button';
import { ColumnInstance } from 'react-table';

export function DefaultFilter({
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
    />
  );
}

interface MultipleSelectionFilterProps {
  options: string[];
  value: string[];
  filterKey: string;
  onChange: (value: string[]) => void;
}

function MultipleSelectionFilter({
  options,
  value = [],
  filterKey,
  onChange,
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
            <div className="menuHeader">Filter by state</div>
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
