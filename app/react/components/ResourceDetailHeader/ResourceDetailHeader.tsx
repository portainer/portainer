import { ReactNode } from 'react';
import clsx from 'clsx';

import { InlineLoader } from '@@/InlineLoader';
import { Alert } from '@@/Alert';
import { Widget } from '@@/Widget';

interface Props {
  isLoading: boolean;
  errorMessage?: string;

  icon: ReactNode;
  iconBackgroundClassName?: string;

  subtitleLabel?: string;
  subtitleClassName?: string;
  title: string;
  badge?: ReactNode;
  description?: ReactNode;

  rightInfo?: ReactNode;
  actionBar?: ReactNode;

  containerClassName?: string;
  widgetClassName?: string;
}

export function ResourceDetailHeader({
  isLoading,
  errorMessage,
  icon,
  iconBackgroundClassName = 'bg-group-accent-3 th-dark:bg-group-accent-10',
  subtitleLabel,
  subtitleClassName = 'text-group-accent-10 th-dark:text-group-accent-8',
  title,
  badge,
  description,
  rightInfo,
  actionBar,
  containerClassName = 'flex items-center gap-4 p-6',
  widgetClassName = 'widget-body',
}: Props) {
  if (isLoading) {
    return (
      <Widget className={widgetClassName}>
        <div className={containerClassName}>
          <InlineLoader>Loading details...</InlineLoader>
        </div>
      </Widget>
    );
  }

  if (errorMessage) {
    return (
      <Widget className={widgetClassName}>
        <div className={containerClassName}>
          <Alert color="error" title="Error">
            {errorMessage}
          </Alert>
        </div>
      </Widget>
    );
  }

  return (
    <Widget className={widgetClassName}>
      <div className={containerClassName}>
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

      {actionBar}
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
