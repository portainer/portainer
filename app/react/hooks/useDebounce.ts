import { debounce } from 'lodash';
import { useState, useRef, useCallback, useEffect } from 'react';

// `useRef` to keep the debouncer function (result of the _.debounce call) between rerenders.
//
// debouncer func is (value, onChange) => { onChange(value) };
//
// Previously written and used as
// const onChangeDebouncer = useRef(debounce(onChange, 300));
// onChangeDebouncer.current(value)
//
// The issue with the previous syntax is that it was holding the initial state of the `onChange` function passed to `useDebounce()`.
// When the `onChange` function was using a dynamic context (vars in parent scope/not in its parameters)
// then invoking the debouncer was producing a result of `onChange` computed uppon the initial state of the function, not the current state.
//
// Example of the issue
//
// function Component({ value }: { value: string; }) {
//
//   function onChange(v: string) {
//     // This will always print the first value of the "value" prop + the updated value of "v"
//     // when called from "handleChange".
//     // This is an issue when the `onChange` is a prop of the component and the real function performs state mutations upflow based on
//     // values that are in the parent component, as `setDebouncedValue` will only use the initial instance of the `onChange` prop, thus
//     // the initial state of the parent component.
//     console.log(value, v)
//   }
//
//   const [debouncedValue, setDebouncedValue] = useDebounce(value, onChange);
//
//   function handleChange(newValue: string) {
//     setDebouncedValue(newValue);
//   }
//
//   return (<Input value={debouncedValue} onChange={(e) => handleChange(e.target.value)} />)
// }
export function useDebounce<T = string>(
  value: T,
  onChange: (value: T) => void,
  delay = 300
) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Do not change. See notes above
  const onChangeDebouncer = useRef(
    debounce(
      (value: T, onChangeFunc: (v: T) => void) => onChangeFunc(value),
      delay
    )
  );

  const handleChange = useCallback(
    (value: T) => {
      setDebouncedValue(value);
      onChangeDebouncer.current(value, onChange);
    },
    [onChangeDebouncer, setDebouncedValue, onChange]
  );

  useEffect(() => {
    setDebouncedValue(value);
  }, [value]);

  return [debouncedValue, handleChange] as const;
}
