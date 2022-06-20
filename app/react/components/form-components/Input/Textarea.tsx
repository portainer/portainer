import clsx from 'clsx';
import { TextareaHTMLAttributes } from 'react';

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      className={clsx('form-control', className)}
    />
  );
}
