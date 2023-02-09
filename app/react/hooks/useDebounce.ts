import _ from 'lodash';
import { useState, useRef, useCallback } from 'react';

export function useDebounce(
  defaultValue: string,
  onChange: (value: string) => void
) {
  const [searchValue, setSearchValue] = useState(defaultValue);

  const onChangeDebounces = useRef(_.debounce(onChange, 300));

  const handleChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      onChangeDebounces.current(value);
    },
    [onChangeDebounces, setSearchValue]
  );

  return [searchValue, handleChange] as const;
}
