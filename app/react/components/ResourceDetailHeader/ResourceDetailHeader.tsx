import { ReactNode } from 'react';
import clsx from 'clsx';

import { Widget } from '@@/Widget';
import { Alert } from '@@/Alert';

interface Props {
  icon: ReactNode;
  iconBackgroundClassName?: string;

  subtitleLabel?: string;
  subtitleClassName?: string;
  title: string;
  badge?: ReactNode;
  description?: ReactNode;

  rightInfo?: ReactNode;
  actionBar?: ReactNode;

  isLoading?: boolean;
  errorMessage?: string;
}

export function ResourceDetailHeader({
  icon,
  iconBackgroundClassName = 'bg-group-accent-3 th-dark:bg-group-accent-10 th-highcontrast:bg-transparent',
  subtitleLabel,
  subtitleClassName = 'text-group-accent-10 th-dark:text-group-accent-8 th-highcontrast:text-white',
  title,
  badge,
  description,
  rightInfo,
  actionBar,
  isLoading,
  errorMessage,
}: Props) {
  return (
    <Widget>
      <Widget.Body loading={isLoading}>
        {errorMessage && (
          <Alert color="error" title="Error">
            {errorMessage}
          </Alert>
        )}
        {!errorMessage && (
          <div className="flex items-center gap-4">
            <HeaderIcon
              icon={icon}
              iconBackgroundClassName={iconBackgroundClassName}
            />
            <HeaderInfo
              subtitleLabel={subtitleLabel}
              subtitleClassName={subtitleClassName}
              title={title}
              badge={badge}
              description={description}
            />
            {rightInfo}
          </div>
        )}
      </Widget.Body>

      {!isLoading && !errorMessage && actionBar}
    </Widget>
  );
}

interface HeaderIconProps {
  icon: ReactNode;
  iconBackgroundClassName: string;
}

function HeaderIcon({ icon, iconBackgroundClassName }: HeaderIconProps) {
  return (
    <div
      className={clsx(
        'flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-3xl',
        iconBackgroundClassName
      )}
    >
      {icon}
    </div>
  );
}

interface HeaderInfoProps {
  subtitleLabel?: string;
  subtitleClassName: string;
  title: string;
  badge?: ReactNode;
  description?: ReactNode;
}

function HeaderInfo({
  subtitleLabel,
  subtitleClassName,
  title,
  badge,
  description,
}: HeaderInfoProps) {
  return (
    <div className="flex flex-1 flex-col">
      {subtitleLabel && (
        <span className={clsx('text-xs font-medium', subtitleClassName)}>
          {subtitleLabel}
        </span>
      )}
      <div className="flex items-center gap-2">
        <h2 className="m-0 text-lg font-bold">{title}</h2>
        {badge && <div className="flex flex-wrap gap-1">{badge}</div>}
      </div>
      {description && <span className="text-muted text-xs">{description}</span>}
    </div>
  );
}
