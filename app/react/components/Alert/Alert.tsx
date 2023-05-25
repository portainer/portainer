import clsx from 'clsx';
import { AlertCircle, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { PropsWithChildren, ReactNode } from 'react';

import { Icon } from '@@/Icon';

type AlertType = 'success' | 'error' | 'info' | 'warn';

const alertSettings: Record<
  AlertType,
  { container: string; header: string; body: string; icon: ReactNode }
> = {
  success: {
    container:
      'border-green-4 bg-green-2 th-dark:bg-green-3 th-dark:border-green-5',
    header: 'text-green-8',
    body: 'text-green-7',
    icon: CheckCircle,
  },
  error: {
    container:
      'border-error-4 bg-error-2 th-dark:bg-error-3 th-dark:border-error-5',
    header: 'text-error-8',
    body: 'text-error-7',
    icon: XCircle,
  },
  info: {
    container:
      'border-blue-4 bg-blue-2 th-dark:bg-blue-3 th-dark:border-blue-5',
    header: 'text-blue-8',
    body: 'text-blue-7',
    icon: AlertCircle,
  },
  warn: {
    container:
      'border-warning-4 bg-warning-2 th-dark:bg-warning-3 th-dark:border-warning-5',
    header: 'text-warning-8',
    body: 'text-warning-7',
    icon: AlertTriangle,
  },
};

export function Alert({
  color,
  title,
  children,
}: PropsWithChildren<{ color: AlertType; title?: string }>) {
  const { container, header, body, icon } = alertSettings[color];

  return (
    <AlertContainer className={container}>
      {title ? (
        <>
          <AlertHeader className={header}>
            <Icon icon={icon} />
            {title}
          </AlertHeader>
          <AlertBody className={body}>{children}</AlertBody>
        </>
      ) : (
        <AlertBody className={clsx(body, 'flex items-center gap-2')}>
          <Icon icon={icon} /> {children}
        </AlertBody>
      )}
    </AlertContainer>
  );
}

function AlertContainer({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx('rounded-md border-2 border-solid', 'p-3', className)}>
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
  children,
}: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx('ml-6 text-sm', className)}>{children}</div>;
}
