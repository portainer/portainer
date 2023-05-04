import { ComponentType, useEffect, useMemo, useState } from 'react';

type KeyRecord<T> = Record<keyof T, T[keyof T]>;

type KeysOfFunctions<T> = keyof {
  [K in keyof T as T[K] extends (v: never) => void ? K : never]: never;
};

type KeysWithoutFunctions<T> = Exclude<keyof T, KeysOfFunctions<T>>;

/**
 * React component wrapper that will sync AngularJS bound variables in React state.
 * This wrapper is mandatory to allow the binding of AngularJS variables directly in controlled components.
 *
 * Without this the component will be redrawn everytime the value changes in AngularJS (outside of React control)
 * and the redraw will create issues when typing in the inputs.
 *
 * Examples
 * ---
 * SINGLE PAIR
 * ```tsx
 * type Props = {
 *  value: unknown;
 *  onChange: (v: unknown) => void;
 * }
 *
 * function ReactComponent({ value, onChange }: Props) {
 *  return <input value={value} onChange={onChange} />
 * }
 *
 * r2a(withControlledInput(ReactComponent), ['value', 'onChange']);
 *
 * ```
 * ---
 * MULTIPLE PAIRS
 * ```tsx
 * type Props = {
 *  valueStr: string;
 *  onChangeStr: (v: string) => void;
 *  valueNum: number;
 *  onChangeNum: (v: number) => void;
 * }
 *
 * function ReactComponent({ valueStr, onChangeStr, valueNum, onChangeNum }: Props) {
 *  return (
 *    <>
 *      <input type="text" value={valueStr} onChange={onChangeStr} />
 *      <input type="number" value={valueNum} onChange={onChangeNum} />
 *    </>
 *  );
 * }
 *
 * r2a(withControlledInput(ReactComponent, {
 *    valueStr: 'onChangeStr',
 *    valueNum: 'onChangeNum'
 *  }),
 *  ['valueStr', 'onChangeStr', 'valueNum', 'onChangeNum']
 * )
 *
 * ```
 *
 * @param WrappedComponent The React component to wrap
 * @param controlledValueOnChangePairs A map of `(value:onChange)-like` pairs.
 * @returns WrappedComponent
 */
export function withControlledInput<T>(
  WrappedComponent: ComponentType<T>,
  controlledValueOnChangePairs:
    | {
        [Key in KeysWithoutFunctions<T>]?: KeysOfFunctions<T>;
      }
    | { value?: 'onChange' } = { value: 'onChange' }
): ComponentType<T> {
  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  // extract keys of values that will be updated outside of React lifecycle and their handler functions
  const keysToControl = Object.entries(controlledValueOnChangePairs) as [
    keyof T,
    keyof T
  ][];

  function WrapperComponent(props: T) {
    // map of key = value for all tracked values that will be changed outside of React lifecycle
    // e.g. save in React state the values that will be changed in AngularJS
    const [controlledValues, setControlledValues] = useState<KeyRecord<T>>(
      {} as KeyRecord<T>
    );

    // generate a map of `funckey = (v: typeof props[value_key]) => void` to wrapp all handler functions.
    // each wrapped handler is referencing the key of the value it is changing so we can't use a single sync func
    const handlers = useMemo(
      () =>
        Object.fromEntries(
          keysToControl.map(([valueKey, onChangeKey]) => [
            onChangeKey,
            // generate and save a func that uses the key of the updated value
            (value: T[keyof T]) => {
              // update the state with the value coming from WrappedComponent
              setControlledValues(
                (c) => ({ ...c, [valueKey]: value } as KeyRecord<T>)
              );

              // call the bound handler func to update the value outside of React
              // eslint-disable-next-line react/destructuring-assignment
              const onChange = props[onChangeKey];
              if (typeof onChange === 'function') {
                onChange(value);
              }
            },
          ])
        ),
      [props]
    );

    // update the React state when a prop changes from outside of React lifecycle
    // limit keys to update to only tracked values ; ignore untracked props and handler functions
    useEffect(() => {
      const toUpdate = Object.fromEntries(
        // eslint-disable-next-line react/destructuring-assignment
        keysToControl.map(([key]) => [key, props[key]])
      ) as KeyRecord<T>;

      setControlledValues(toUpdate);
    }, [props]);

    return <WrappedComponent {...props} {...handlers} {...controlledValues} />;
  }

  WrapperComponent.displayName = `withControlledInput(${displayName})`;

  return WrapperComponent;
}
