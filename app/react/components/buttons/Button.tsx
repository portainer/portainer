import {
  AriaAttributes,
  ComponentType,
  forwardRef,
  MouseEventHandler,
  PropsWithChildren,
  ReactNode,
} from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { AutomationTestingProps } from '@/types';
import { cn } from '@/react/utils/cn';

import { Icon } from '@@/Icon';

type Type = 'submit' | 'button' | 'reset';
type Color =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'link'
  | 'light'
  | 'dangerlight'
  | 'warninglight'
  | 'warning'
  | 'success'
  | 'blue'
  | 'none';
type Size = 'xsmall' | 'small' | 'medium' | 'large';

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-1.5 rounded font-medium',
    'transition-colors duration-150 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-7 focus-visible:ring-offset-1',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none whitespace-nowrap',
  ],
  {
    variants: {
      color: {
        primary: [
          'border border-blue-8 bg-blue-8 text-white',
          'hover:border-blue-9 hover:bg-blue-9',
          'th-dark:border-blue-7 th-dark:bg-blue-7 th-dark:hover:border-blue-6 th-dark:hover:bg-blue-6',
          'th-highcontrast:border th-highcontrast:border-solid th-highcontrast:border-white th-highcontrast:bg-blue-8 th-highcontrast:hover:bg-blue-9',
        ],
        blue: [
          'border border-blue-8 bg-blue-8 text-white',
          'hover:border-blue-9 hover:bg-blue-9',
          'th-dark:border-blue-7 th-dark:bg-blue-7 th-dark:hover:border-blue-6 th-dark:hover:bg-blue-6',
        ],
        secondary: [
          'border border-gray-5 bg-white text-gray-8',
          'hover:border-gray-6 hover:bg-gray-1',
          'th-dark:border-gray-7 th-dark:bg-gray-9 th-dark:text-white th-dark:hover:bg-gray-8',
          'th-highcontrast:border th-highcontrast:border-white th-highcontrast:bg-transparent th-highcontrast:text-white th-highcontrast:hover:bg-gray-9',
        ],
        default: [
          'border border-gray-5 bg-white text-gray-8',
          'hover:border-gray-6 hover:bg-gray-1',
          'th-dark:border-gray-7 th-dark:bg-gray-9 th-dark:text-gray-2 th-dark:hover:bg-gray-8',
        ],
        danger: [
          'border border-error-7 bg-error-7 text-white',
          'hover:border-error-8 hover:bg-error-8',
          'th-dark:border-error-6 th-dark:bg-error-6 th-dark:hover:border-error-7 th-dark:hover:bg-error-7',
          'th-highcontrast:border th-highcontrast:border-white th-highcontrast:bg-error-7 th-highcontrast:hover:bg-error-8',
        ],
        dangerlight: [
          'border border-error-3 bg-error-1 text-error-7',
          'hover:border-error-4 hover:bg-error-2',
          'th-dark:border-error-7 th-dark:bg-error-9 th-dark:text-error-3 th-dark:hover:bg-error-8',
        ],
        warning: [
          'border border-warning-7 bg-warning-7 text-white',
          'hover:border-warning-8 hover:bg-warning-8',
          'th-dark:border-warning-6 th-dark:bg-warning-6 th-dark:hover:border-warning-7 th-dark:hover:bg-warning-7',
        ],
        warninglight: [
          'border border-warning-5 bg-warning-2 text-black',
          'hover:border-warning-6 hover:bg-warning-3',
          'th-dark:border-blue-8 th-dark:bg-blue-8 th-dark:bg-opacity-10 th-dark:text-white',
          'th-highcontrast:bg-warning-5 th-highcontrast:bg-opacity-10 th-highcontrast:text-white',
        ],
        success: [
          'border border-success-7 bg-success-7 text-white',
          'hover:border-success-8 hover:bg-success-8',
          'th-dark:border-success-6 th-dark:bg-success-6 th-dark:hover:border-success-7 th-dark:hover:bg-success-7',
        ],
        light: [
          'border border-gray-4 bg-gray-2 text-gray-8',
          'hover:border-gray-5 hover:bg-gray-3',
          'th-dark:border-gray-6 th-dark:bg-gray-8 th-dark:text-gray-2 th-dark:hover:bg-gray-7',
        ],
        link: [
          'border-0 bg-transparent text-blue-8 underline-offset-2',
          'hover:text-blue-9 hover:underline',
          'th-dark:text-blue-6 th-dark:hover:text-blue-5',
        ],
        none: [
          'border-0 bg-transparent p-0 m-0',
          'focus-visible:ring-0 focus-visible:ring-offset-0',
        ],
      },
      size: {
        xsmall: 'h-6 px-2 text-xs',
        small: 'h-8 px-3 text-sm',
        medium: 'h-9 px-4 text-sm',
        large: 'h-10 px-5 text-base',
      },
    },
    defaultVariants: {
      color: 'primary',
      size: 'small',
    },
  }
);

export interface Props<TasProps = unknown>
  extends AriaAttributes,
    AutomationTestingProps {
  icon?: ReactNode | ComponentType<unknown>;

  color?: Color;
  size?: Size;
  disabled?: boolean;
  title?: string;
  className?: string;
  type?: Type;
  as?: ComponentType<TasProps> | string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  mRef?: React.ForwardedRef<HTMLButtonElement>;
  props?: Omit<TasProps, keyof Props>;
}

export const ButtonWithRef = forwardRef<HTMLButtonElement, Omit<Props, 'mRef'>>(
  (props, ref) => (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Button {...props} mRef={ref} />
  )
);

ButtonWithRef.displayName = 'ButtonWithRef';

export function Button<TasProps = unknown>({
  type = 'button',
  color = 'primary',
  size = 'small',
  disabled = false,
  className,
  onClick,
  title,
  icon,
  children,
  as = 'button',
  props,
  mRef,
  ...ariaProps
}: PropsWithChildren<Props<TasProps>>) {
  const Component = as as 'button';
  return (
    <Component
      ref={mRef}
      type={type}
      disabled={disabled}
      className={cn(buttonVariants({ color, size }), className)}
      onClick={(e) => {
        if (!disabled) {
          onClick?.(e);
        }
      }}
      title={title}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...ariaProps}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    >
      {icon && <Icon icon={icon} size={getIconSize(size)} />}
      {children}
    </Component>
  );
}

function getIconSize(size: Size) {
  switch (size) {
    case 'xsmall':
      return 'xs';
    case 'medium':
      return 'md';
    case 'large':
      return 'lg';
    case 'small':
    default:
      return 'sm';
  }
}

export { buttonVariants };
export type { VariantProps };
