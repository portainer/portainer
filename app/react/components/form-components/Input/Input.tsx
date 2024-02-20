import clsx from 'clsx';
import { forwardRef, InputHTMLAttributes, Ref } from 'react';

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
  value,
  type,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  mRef?: Ref<HTMLInputElement>;
}) {
  return (
    <input
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      type={type}
      value={type === 'number' && Number.isNaN(value) ? '' : value} // avoid the `"NaN" cannot be parsed, or is out of range.` error for an empty number input
      ref={ref}
      className={clsx('form-control', className)}
    />
  );
}
