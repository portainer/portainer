import clsx from 'clsx';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { PropsWithChildren, ReactNode } from 'react';

import { Icon } from '@@/Icon';

type AlertType = 'success' | 'error' | 'info';

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
};

export function Alert({
  color,
  title,
  children,
}: PropsWithChildren<{ color: AlertType; title: string }>) {
  const { container, header, body, icon } = alertSettings[color];

  return (
    <AlertContainer className={container}>
      <AlertHeader className={header}>
        <Icon icon={icon} />
        {title}
      </AlertHeader>
      <AlertBody className={body}>{children}</AlertBody>
    </AlertContainer>
  );
}

function AlertContainer({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx('border-2 border-solid rounded-md', 'p-3', className)}>
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
      className={clsx('text-base', 'flex gap-2 items-center !m-0', className)}
    >
      {children}
    </h4>
  );
}

function AlertBody({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx('ml-6 mt-2 text-sm', className)}>{children}</div>;
}
