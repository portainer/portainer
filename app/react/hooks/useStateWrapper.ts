import { useState, useCallback, useEffect } from 'react';

export function useStateWrapper<T>(value: T, onChange: (value: T) => void) {
  const [inputValue, setInputValue] = useState(value);

  const updateInputValue = useCallback(
    (value: T) => {
      setInputValue(value);
      onChange(value);
    },
    [onChange, setInputValue]
  );

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return [inputValue, updateInputValue] as const;
}
