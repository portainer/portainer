import _ from 'lodash';
import { useState } from 'react';

interface Props {
  value: number;
  onChange(value: number): void;
  showAll?: boolean;
}

export function ItemsPerPageSelector({ value, onChange, showAll }: Props) {
  const [id] = useState(() => `${_.uniqueId()}-items-per-page`);
  return (
    <span className="limitSelector">
      <label
        className="space-right text-xs text-[--text-main-color] font-normal"
        htmlFor={id}
      >
        Items per page
      </label>
      <select
        id={id}
        className="form-control"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        data-cy="paginationSelect"
      >
        {showAll ? <option value={Number.MAX_SAFE_INTEGER}>All</option> : null}
        {[10, 25, 50, 100].map((v) => (
          <option value={v} key={v}>
            {v}
          </option>
        ))}
      </select>
    </span>
  );
}
