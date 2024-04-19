import clsx from 'clsx';
import { TextareaHTMLAttributes } from 'react';

import { AutomationTestingProps } from '@/types';

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & AutomationTestingProps) {
  return (
    <textarea
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      className={clsx('form-control', className)}
    />
  );
}
