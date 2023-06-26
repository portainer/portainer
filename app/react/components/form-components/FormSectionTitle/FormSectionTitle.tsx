import clsx from 'clsx';
import { PropsWithChildren } from 'react';

interface Props {
  htmlFor?: string;
  titleSize?: 'sm' | 'md' | 'lg';
}

const tailwindTitleSize = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function FormSectionTitle({
  children,
  htmlFor,
  titleSize = 'md',
}: PropsWithChildren<Props>) {
  if (htmlFor) {
    return (
      <label
        htmlFor={htmlFor}
        className={clsx(
          'col-sm-12 mt-1 mb-2 flex cursor-pointer items-center pl-0 font-medium',
          tailwindTitleSize[titleSize]
        )}
      >
        {children}
      </label>
    );
  }
  return (
    <div
      className={clsx(
        'col-sm-12 mt-1 mb-2 pl-0 font-medium',
        tailwindTitleSize[titleSize]
      )}
    >
      {children}
    </div>
  );
}
