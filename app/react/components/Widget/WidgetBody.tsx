import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { useWidgetContext } from './Widget';
import { Loading } from './Loading';

interface Props {
  loading?: boolean;
  className?: string;
}

export function WidgetBody({
  loading,
  className,
  children,
}: PropsWithChildren<Props>) {
  useWidgetContext();

  return (
    <div className={clsx(className, 'widget-body')}>
      {loading ? <Loading /> : <div className="widget-content">{children}</div>}
    </div>
  );
}
