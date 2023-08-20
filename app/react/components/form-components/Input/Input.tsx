import clsx from 'clsx';
import {
  ChangeEvent,
  ChangeEventHandler,
  forwardRef,
  InputHTMLAttributes,
  Ref,
  useEffect,
  useRef,
  useState,
} from 'react';

export const InputWithRef = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(
  // eslint-disable-next-line react/jsx-props-no-spreading
  (props, ref) => <Input {...props} mRef={ref} />
);

export function Input({
  className,
  mRef: ref,
  controlled,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  mRef?: Ref<HTMLInputElement>;
  /** controlled is a workaround for mixing angularjs and react forms, try not to use it */
  controlled?: boolean;
}) {
  if (controlled) {
    // eslint-disable-next-line react/jsx-props-no-spreading
    return <ControlledInput {...props} />;
  }

  return (
    <input
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      ref={ref}
      className={clsx('form-control', className)}
    />
  );
}

export function ControlledInput({
  value,
  onChange,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const { ref, onChange: handleChange } = useControlledInput({
    value,
    onChange,
  });

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <InputWithRef {...props} ref={ref} onChange={handleChange} value={value} />
  );
}

function useControlledInput<T>({
  value,
  onChange,
}: {
  value: T;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}) {
  const [cursor, setCursor] = useState<number | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = ref.current;
    if (input) input.setSelectionRange(cursor, cursor);
  }, [ref, cursor, value]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setCursor(e.target.selectionStart);
    onChange?.(e);
  }

  return {
    ref,
    onChange: handleChange,
  };
}
