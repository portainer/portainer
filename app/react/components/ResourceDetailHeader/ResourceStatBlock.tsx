import { ReactNode, createContext, useContext } from 'react';
import clsx from 'clsx';
import { cva, type VariantProps } from 'class-variance-authority';

import { StatusDot, type StatusDotColor } from '@@/primitives/StatusDot';

const containerVariants = cva(
  'flex min-w-[6rem] flex-col gap-1 rounded-md border border-solid px-3 py-2',
  {
    variants: {
      status: {
        success:
          'border-green-4 bg-green-2 th-dark:border-green-8 th-dark:bg-green-10 th-highcontrast:border-white th-highcontrast:bg-green-10',
        danger:
          'border-error-4 bg-error-2 th-dark:border-error-8 th-dark:bg-error-10 th-highcontrast:border-white th-highcontrast:bg-error-10',
        warning:
          'border-warning-4 bg-warning-2 th-dark:border-warning-8 th-dark:bg-warning-10 th-highcontrast:border-white th-highcontrast:bg-warning-10',
        pending:
          'border-blue-4 bg-blue-2 th-dark:border-blue-8 th-dark:bg-blue-10 th-highcontrast:border-white th-highcontrast:bg-blue-10',
        muted:
          'border-gray-4 bg-gray-2 th-dark:border-gray-8 th-dark:bg-gray-iron-10 th-highcontrast:border-gray-11 th-highcontrast:bg-transparent',
      },
    },
    defaultVariants: { status: 'muted' },
  }
);

const valueVariants = cva('font-semibold leading-tight', {
  variants: {
    status: {
      success: 'text-green-8 th-dark:text-white th-highcontrast:text-white',
      danger: 'text-error-8 th-dark:text-white th-highcontrast:text-white',
      warning: 'text-warning-8 th-dark:text-white th-highcontrast:text-white',
      pending: 'text-blue-8 th-dark:text-white th-highcontrast:text-white',
      muted: 'text-graphite-700 th-dark:text-white th-highcontrast:text-white',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: { status: 'muted', size: 'xs' },
});

const statusToColor: Record<ResourceStatBlockStatus, StatusDotColor> = {
  success: 'success',
  danger: 'danger',
  warning: 'warn',
  pending: 'info',
  muted: 'muted',
};

export type ResourceStatBlockStatus = NonNullable<
  VariantProps<typeof containerVariants>['status']
>;

const StatusContext = createContext<ResourceStatBlockStatus>('muted');

interface RootProps {
  status?: ResourceStatBlockStatus;
  children: ReactNode;
  'data-cy'?: string;
}

export function ResourceStatBlock({
  status = 'muted',
  children,
  'data-cy': dataCy,
}: RootProps) {
  return (
    <StatusContext.Provider value={status}>
      <div className={containerVariants({ status })} data-cy={dataCy}>
        {children}
      </div>
    </StatusContext.Provider>
  );
}

interface LabelProps {
  icon?: ReactNode;
  children: ReactNode;
}

function StatBlockLabel({ icon, children }: LabelProps) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-normal uppercase tracking-wide text-gray-6 th-highcontrast:text-white th-dark:text-gray-6">
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}

const valueAlignClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
} as const;

interface ValueProps {
  dot?: boolean;
  suffix?: ReactNode;
  size?: NonNullable<VariantProps<typeof valueVariants>['size']>;
  align?: keyof typeof valueAlignClasses;
  children: ReactNode;
}

function StatBlockValue({
  dot,
  suffix,
  size = 'xs',
  align = 'start',
  children,
}: ValueProps) {
  const status = useContext(StatusContext);

  return (
    <div
      className={clsx('flex items-baseline gap-2', valueAlignClasses[align])}
    >
      {dot && (
        <span data-cy="stat-block-dot">
          <StatusDot color={statusToColor[status]} size="sm" />
        </span>
      )}
      <span className={valueVariants({ status, size })}>{children}</span>
      {suffix && (
        <span className="text-sm font-normal text-gray-9 th-highcontrast:text-white th-dark:text-gray-5">
          {suffix}
        </span>
      )}
    </div>
  );
}

interface MetaProps {
  children: ReactNode;
}

function StatBlockMeta({ children }: MetaProps) {
  return (
    <span className="text-xs text-gray-7 th-highcontrast:text-white th-dark:text-gray-5">
      {children}
    </span>
  );
}

ResourceStatBlock.Label = StatBlockLabel;
ResourceStatBlock.Value = StatBlockValue;
ResourceStatBlock.Meta = StatBlockMeta;
