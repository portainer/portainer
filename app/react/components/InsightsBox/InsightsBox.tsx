import clsx from 'clsx';
import { Lightbulb, X } from 'lucide-react';
import { ReactNode } from 'react';
import { useStore } from 'zustand';

import { Button } from '@@/buttons';

import { insightStore } from './insights-store';

export type Props = {
  header?: string;
  content?: ReactNode;
  insightCloseId?: string; // set if you want to be able to close the box and not show it again
  type?: 'default' | 'slim';
  className?: string;
};

export function InsightsBox({
  header,
  content,
  insightCloseId,
  type = 'default',
  className,
}: Props) {
  // allow to close the box and not show it again in local storage with zustand
  const { addInsightIDClosed, isClosed } = useStore(insightStore);
  const isInsightClosed = isClosed(insightCloseId);

  if (isInsightClosed) {
    return null;
  }

  return (
    <div
      className={clsx(
        'relative flex w-full gap-1 rounded-lg bg-gray-modern-3 p-4 text-sm th-highcontrast:bg-legacy-grey-3 th-dark:bg-legacy-grey-3',
        type === 'slim' && 'p-2',
        className
      )}
    >
      <div className="mt-0.5 shrink-0">
        <Lightbulb className="h-4 text-warning-7 th-highcontrast:text-warning-6 th-dark:text-warning-6" />
      </div>
      <div>
        {header && (
          <p
            className={clsx(
              // text-[0.9em] matches .form-horizontal .control-label font-size used in many labels in portainer
              'align-middle text-[0.9em] font-medium',
              insightCloseId && 'pr-10',
              content ? 'mb-2' : 'mb-0'
            )}
          >
            {header}
          </p>
        )}
        {content && (
          <div className={clsx('small', !header && insightCloseId && 'pr-6')}>
            {content}
          </div>
        )}
      </div>
      {insightCloseId && (
        <Button
          icon={X}
          className={clsx(
            'absolute top-3 right-2 flex !text-gray-7 hover:!text-gray-8 th-highcontrast:!text-gray-6 th-highcontrast:hover:!text-gray-5 th-dark:!text-gray-6 th-dark:hover:!text-gray-5',
            type === 'slim' && insightCloseId && 'top-1'
          )}
          color="link"
          size="medium"
          onClick={() => addInsightIDClosed(insightCloseId)}
        />
      )}
    </div>
  );
}
