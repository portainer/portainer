import clsx from 'clsx';
import { PropsWithChildren } from 'react';

interface Props {
  htmlFor?: string;
  titleSize?: 'sm' | 'md' | 'lg';
  className?: string;
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
  className,
}: PropsWithChildren<Props>) {
  if (htmlFor) {
    return (
      <label
        htmlFor={htmlFor}
        className={clsx(
          'col-sm-12 mb-2 mt-1 flex cursor-pointer items-center pl-0 font-medium',
          tailwindTitleSize[titleSize],
          className
        )}
      >
        {children}
      </label>
    );
  }
  return (
    <div
      className={clsx(
        'col-sm-12 mb-2 mt-4 pl-0 font-medium',
        tailwindTitleSize[titleSize],
        className
      )}
    >
      {children}
    </div>
  );
}
