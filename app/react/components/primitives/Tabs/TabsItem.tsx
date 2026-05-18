import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  AriaAttributes,
  createContext,
  PropsWithChildren,
  useContext,
} from 'react';

const tabItem = cva(
  'inline-flex cursor-pointer select-none items-center gap-2 whitespace-nowrap no-underline hover:no-underline focus:no-underline transition-colors duration-150',
  {
    variants: {
      variant: {
        pill: 'rounded-full border border-solid',
        contained: 'rounded-lg border-0',
      },
      size: {
        md: '',
        sm: '',
      },
      isActive: {
        true: '',
        false: '',
      },
      disabled: {
        true: 'cursor-default opacity-50',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'pill', size: 'md', className: 'px-2.5 py-2 text-xs' },
      { variant: 'pill', size: 'sm', className: 'px-2 py-1.5 text-[11px]' },
      { variant: 'contained', size: 'md', className: 'px-4 py-2 text-sm' },
      { variant: 'contained', size: 'sm', className: 'px-3 py-1.5 text-xs' },
      {
        variant: 'pill',
        isActive: false,
        disabled: false,
        className: [
          'border-gray-5 bg-gray-neutral-3 text-gray-6',
          'th-dark:border-legacy-grey-3 th-dark:bg-gray-iron-11 th-dark:text-gray-5',
          'th-highcontrast:border-white th-highcontrast:bg-black th-highcontrast:text-gray-3',
          'hover:border-gray-6 hover:bg-gray-2 hover:text-gray-9',
          'th-dark:hover:bg-gray-iron-10 th-dark:hover:text-white',
        ],
      },
      {
        variant: 'pill',
        isActive: true,
        className: [
          'border-blue-5 bg-blue-1 text-blue-7',
          'th-dark:border-blue-7 th-dark:bg-blue-11 th-dark:text-blue-4',
          'th-highcontrast:border-blue-5 th-highcontrast:bg-blue-11 th-highcontrast:text-blue-4',
        ],
      },
      {
        variant: 'contained',
        isActive: false,
        disabled: false,
        className: [
          'bg-transparent text-gray-7 th-highcontrast:text-white th-dark:text-gray-6',
          'hover:bg-graphite-50 hover:text-graphite-900',
          'th-dark:hover:bg-graphite-600 th-dark:hover:text-gray-6',
          'th-highcontrast:hover:bg-white th-highcontrast:hover:text-black',
        ],
      },
      {
        variant: 'contained',
        isActive: true,
        className: [
          'bg-graphite-50 text-graphite-900',
          'th-dark:bg-graphite-600 th-dark:text-white',
          'th-highcontrast:bg-white th-highcontrast:text-black',
        ],
      },
    ],
    defaultVariants: {
      variant: 'pill',
      size: 'md',
      isActive: false,
      disabled: false,
    },
  }
);

export type TabVariant = NonNullable<VariantProps<typeof tabItem>['variant']>;
export type TabSize = NonNullable<VariantProps<typeof tabItem>['size']>;

interface TabContextValue {
  variant: TabVariant;
  size: TabSize;
}

export const TabContext = createContext<TabContextValue>({
  variant: 'pill',
  size: 'md',
});

interface Props extends AriaAttributes, VariantProps<typeof tabItem> {
  asChild?: boolean;
  className?: string;
  onClick?(): void;
}

export function TabItem({
  asChild = false,
  variant: variantProp,
  isActive,
  disabled,
  size: sizeProp,
  className,
  children,
  onClick,
  ...ariaProps
}: PropsWithChildren<Props>) {
  const ctx = useContext(TabContext);
  const variant = variantProp ?? ctx.variant;
  const size = sizeProp ?? ctx.size;

  const Component = asChild ? Slot : 'button';

  return (
    <Component
      className={tabItem({ variant, size, isActive, disabled, className })}
      type={asChild ? undefined : 'button'}
      disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={disabled ? undefined : onClick}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...ariaProps}
    >
      {children}
    </Component>
  );
}
