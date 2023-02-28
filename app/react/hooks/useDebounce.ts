import _ from 'lodash';
import { useState, useRef, useCallback, useEffect } from 'react';

export function useDebounce(value: string, onChange: (value: string) => void) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  const onChangeDebounces = useRef(_.debounce(onChange, 300));

  const handleChange = useCallback(
    (value: string) => {
      setDebouncedValue(value);
      onChangeDebounces.current(value);
    },
    [onChangeDebounces, setDebouncedValue]
  );

  useEffect(() => {
    setDebouncedValue(value);
  }, [value]);

  return [debouncedValue, handleChange] as const;
}
