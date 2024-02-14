import clsx from 'clsx';
import { ComponentProps, ComponentType, ElementType } from 'react';

export type AsComponentProps<E extends ElementType = ElementType> =
  ComponentProps<E> & {
    as?: E;
  };

export function BlocklistItem<T extends ElementType>({
  className,
  isSelected,
  children,
  as = 'button',
  ...props
}: AsComponentProps & {
  isSelected?: boolean;
  as?: ComponentType<T>;
}) {
  const Component = as as 'button';

  return (
    <Component
      type="button"
      className={clsx(
        className,
        'blocklist-item flex items-stretch overflow-hidden bg-transparent w-full !ml-0 no-link text-left',
        {
          'blocklist-item--selected': isSelected,
        }
      )}
      role="listitem"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    >
      {children}
    </Component>
  );
}
