import clsx from 'clsx';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
} from 'lucide-react';
import { PropsWithChildren, ReactNode } from 'react';

import { Icon } from '@@/Icon';

type AlertType = 'success' | 'error' | 'info' | 'warn' | 'default';

export const alertSettings: Record<
  AlertType,
  { container: string; header: string; body: string; icon: ReactNode }
> = {
  success: {
    container:
      'border-green-4 bg-green-2 th-dark:bg-green-10 th-dark:border-green-8 th-highcontrast:bg-green-10 th-highcontrast:border-white',
    header: 'text-green-8 th-dark:text-white th-highcontrast:text-white',
    body: 'text-green-7 th-dark:text-white th-highcontrast:text-white',
    icon: CheckCircle,
  },
  error: {
    container:
      'border-error-4 bg-error-2 th-dark:bg-error-10 th-dark:border-error-8 th-highcontrast:bg-error-10 th-highcontrast:border-white',
    header: 'text-error-8 th-dark:text-white th-highcontrast:text-white',
    body: 'text-error-7 th-dark:text-white th-highcontrast:text-white',
    icon: XCircle,
  },
  info: {
    container:
      'border-blue-4 bg-blue-2 th-dark:bg-blue-10 th-dark:border-blue-8 th-highcontrast:bg-blue-10 th-highcontrast:border-white',
    header: 'text-blue-8 th-dark:text-white th-highcontrast:text-white',
    body: 'text-blue-7 th-dark:text-white th-highcontrast:text-white',
    icon: AlertCircle,
  },
  warn: {
    container:
      'border-warning-4 bg-warning-2 th-dark:bg-warning-10 th-dark:border-warning-8 th-highcontrast:bg-warning-10 th-highcontrast:border-white',
    header: 'text-warning-8 th-dark:text-white th-highcontrast:text-white',
    body: 'text-warning-7 th-dark:text-white th-highcontrast:text-white',
    icon: AlertTriangle,
  },
  default: {
    container:
      'border-graphite-200 bg-graphite-50 th-dark:bg-graphite-700 th-dark:border-graphite-500 th-highcontrast:bg-graphite-800 th-highcontrast:border-white',
    header: 'text-graphite-600 th-dark:text-white th-highcontrast:text-white',
    body: 'text-graphite-500 th-dark:text-white th-highcontrast:text-white',
    icon: Info,
  },
};

export function Alert({
  color,
  title,
  className,
  children,
}: PropsWithChildren<{
  color: AlertType;
  title?: string;
  className?: string;
}>) {
  const { container, header, body, icon } = alertSettings[color];

  return (
    <AlertContainer className={clsx(container, className)}>
      {title ? (
        <>
          <AlertHeader className={header}>
            <Icon icon={icon} />
            {title}
          </AlertHeader>
          <AlertBody className={body} hasTitle={!!title}>
            {children}
          </AlertBody>
        </>
      ) : (
        <AlertBody
          className={clsx(body, 'flex items-start gap-2')}
          hasTitle={!!title}
        >
          <Icon icon={icon} className="!mt-0.5 flex-none" /> {children}
        </AlertBody>
      )}
    </AlertContainer>
  );
}

export function AlertContainer({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={clsx(
        'border rounded-xl border-solid [&_ul]:ps-8',
        'p-3',
        className
      )}
    >
      {children}
    </div>
  );
}

function AlertHeader({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <h4
      className={clsx(
        'text-base',
        '!m-0 mb-2 flex items-center gap-2',
        className
      )}
    >
      {children}
    </h4>
  );
}

function AlertBody({
  className,
  hasTitle,
  children,
}: PropsWithChildren<{ className?: string; hasTitle: boolean }>) {
  return (
    <div className={clsx('text-sm', className, { 'ml-6': hasTitle })}>
      {children}
    </div>
  );
}
