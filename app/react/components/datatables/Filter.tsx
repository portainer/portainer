import clsx from 'clsx';
import { useMemo } from 'react';
import { Menu, MenuButton, MenuPopover } from '@reach/menu-button';
import { Column, Row, TableMeta } from '@tanstack/react-table';
import { Check, Filter } from 'lucide-react';
import _ from 'lodash';

import { getValueAsArrayOfStrings } from '@/portainer/helpers/array';

import { Icon } from '@@/Icon';

import { DefaultType } from './types';

interface MultipleSelectionFilterProps {
  options: Array<string> | ReadonlyArray<string>;
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

  // This will make sure that if the current value has options that are not in the options list,
  // they will still be displayed in the filter menu.
  const optionsWithValues = useMemo(
    () => _.uniq([...options, ...value]),
    [options, value]
  );

  return (
    <div>
      <Menu>
        <MenuButton
          className={clsx('table-filter flex items-center gap-1', {
            'filter-active': enabled,
          })}
        >
          Filter
          <Icon icon={enabled ? Check : Filter} />
        </MenuButton>
        <MenuPopover className="dropdown-menu">
          <div className="tableMenu">
            <div className="menuHeader">{menuTitle}</div>
            <div className="menuContent">
              {optionsWithValues.map((option, index) => (
                <div className="md-checkbox" key={index}>
                  <input
                    id={`filter_${filterKey}_${index}`}
                    type="checkbox"
                    checked={value.includes(option)}
                    onChange={() => handleChange(option)}
                    data-cy={`filter_${filterKey}_${index}`}
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

export type FilterOptionsTransformer<TData extends DefaultType> = (
  rows: Row<TData>[],
  id: string,
  tableMeta: TableMeta<TData>
) => string[];

export function filterHOC<TData extends DefaultType>(
  menuTitle: string,
  filterOptionsTransformer: FilterOptionsTransformer<TData> = defaultFilterOptionsTransformer
) {
  return function Filter({
    column: { getFilterValue, setFilterValue, getFacetedRowModel, id },
    tableMeta,
  }: {
    column: Column<TData>;
    tableMeta: TableMeta<TData>;
  }) {
    const { flatRows } = getFacetedRowModel();

    const options = useMemo(
      () => filterOptionsTransformer(flatRows, id, tableMeta),
      [flatRows, id, tableMeta]
    );

    const value = getFilterValue();

    const valueAsArray = getValueAsArrayOfStrings(value);

    return (
      <MultipleSelectionFilter
        options={options}
        filterKey={id}
        value={valueAsArray}
        onChange={setFilterValue}
        menuTitle={menuTitle}
      />
    );
  };
}

function defaultFilterOptionsTransformer<TData extends DefaultType>(
  rows: Row<TData>[],
  id: string
) {
  const options = new Set<string>();
  rows.forEach(({ getValue }) => {
    const value = getValue<string>(id);
    options.add(value);
  });
  return Array.from(options);
}
