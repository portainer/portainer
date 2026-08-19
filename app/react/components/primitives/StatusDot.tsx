import { cva, type VariantProps } from 'class-variance-authority';

const statusDot = cva(
  [
    'inline-block shrink-0 rounded-full',
    'shadow-[0_0_8px_var(--tw-shadow-color)]',
  ],
  {
    variants: {
      color: {
        success: 'bg-success-7 shadow-success-7/40',
        warn: 'bg-warning-7 shadow-warning-7/40',
        danger: 'bg-error-7 shadow-error-7/40',
        muted: 'bg-gray-5 th-dark:bg-gray-7',
        info: 'bg-blue-7 shadow-blue-7/40',
      },
      size: {
        xs: 'h-1.5 w-1.5',
        sm: 'h-2 w-2',
        md: 'h-2.5 w-2.5',
      },
      pulse: {
        true: 'animate-pulse',
      },
    },
    defaultVariants: {
      color: 'muted',
      size: 'md',
    },
  }
);

export type StatusDotColor = NonNullable<
  VariantProps<typeof statusDot>['color']
>;
export type StatusDotSize = NonNullable<VariantProps<typeof statusDot>['size']>;

interface Props extends VariantProps<typeof statusDot> {
  className?: string;
}

export function StatusDot({ color, size, pulse, className }: Props) {
  return (
    <span
      aria-hidden="true"
      className={statusDot({ color, size, pulse, className })}
    />
  );
}
