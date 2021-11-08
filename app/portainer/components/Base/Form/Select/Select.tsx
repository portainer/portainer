import { ChangeEvent, PropsWithChildren } from 'react';

import './Select.css';

export interface Props {
  name: string;
  options: { text: string; value: string }[];
  value: string;
  onChange: (value: ChangeEvent<HTMLSelectElement>) => void;
}

export function Select({
  name,
  options,
  value,
  onChange,
  children,
}: PropsWithChildren<Props>) {
  const selectOptions = options.map((option) => (
    <option key={option.value} value={option.value}>
      {option.text}
    </option>
  ));

  return (
    <div className="form-group form-horizontal">
      <label htmlFor={name} className="control-label text-left">
        {children}
      </label>
      <div className="col-sm-10">
        <select
          id={name}
          name={name}
          className="form-control"
          value={value}
          onChange={onChange}
        >
          {selectOptions}
        </select>
      </div>
    </div>
  );
}
