import { CellContext } from '@tanstack/react-table';
import { HelpCircle } from 'lucide-react';
import clsx from 'clsx';

import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

import { Job } from '../types';

import { columnHelper } from './helper';
import styles from './status.module.css';

export const status = columnHelper.accessor((row) => row.Status, {
  header: 'Status',
  id: 'status',
  cell: Cell,
});

function Cell({ row: { original: item } }: CellContext<Job, string>) {
  return (
    <>
      <span
        className={clsx([
          styles.statusIndicator,
          {
            [styles.ok]: item.Status !== 'Failed',
          },
        ])}
      />
      {item.Status ?? ''}
      {item.Status === 'Failed' && (
        <span className="ml-1">
          <TooltipWithChildren
            message={
              <div>
                <span>{item.FailedReason}</span>
              </div>
            }
            position="bottom"
          >
            <span className="vertical-center text-muted inline-flex whitespace-nowrap text-base">
              <HelpCircle className="lucide" aria-hidden="true" />
            </span>
          </TooltipWithChildren>
        </span>
      )}
    </>
  );
}
