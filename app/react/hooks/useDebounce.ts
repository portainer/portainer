import _ from 'lodash';
import { useState, useRef } from 'react';

export function useDebounce(
  defaultValue: string,
  onChange: (value: string) => void
) {
  const [searchValue, setSearchValue] = useState(defaultValue);

  const onChangeDebounces = useRef(_.debounce(onChange, 300));

  return [searchValue, handleChange] as const;

  function handleChange(value: string) {
    setSearchValue(value);
    onChangeDebounces.current(value);
  }
}
