import { ChangeEvent, PropsWithChildren, useState } from 'react';

import './Select.css';

export interface Props {
  name: string;
  options: { text: string; value: string }[];
  selectedOption?: string;
  customOnChange?: (value: string) => void;
}

export function Select({
  name,
  options,
  selectedOption,
  customOnChange,
  children,
}: PropsWithChildren<Props>) {
  const [selectValue, setSelectValue] = useState(selectedOption);

  function onChange(value: ChangeEvent<HTMLSelectElement>) {
    setSelectValue(value.target.value);
    if (customOnChange) {
      customOnChange(value.target.value);
    }
  }

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
          value={selectValue}
          onChange={(v) => onChange(v)}
        >
          {selectOptions}
        </select>
      </div>
    </div>
  );
}
