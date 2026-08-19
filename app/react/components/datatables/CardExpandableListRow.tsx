import { ReactNode } from 'react';
import { Cell, Row, flexRender } from '@tanstack/react-table';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

import { Icon } from '@@/Icon';

import { DefaultType } from './types';

interface Props<D extends DefaultType> {
  row: Row<D>;
  renderSubRow(row: Row<D>): ReactNode;
  expandOnClick?: boolean;
}

export function CardExpandableListRow<D extends DefaultType>({
  row,
  renderSubRow,
  expandOnClick,
}: Props<D>) {
  const cells = row.getVisibleCells();
  const canExpand = row.getCanExpand();
  const isExpanded = canExpand && row.getIsExpanded();

  const { selectCell, dataCells } = groupCells(cells);
  const { titleCell, actionCells, metaCells } = splitDataCells(dataCells);

  const isCardClickable = !!expandOnClick && canExpand;
  function handleCardClick(e: React.MouseEvent | React.KeyboardEvent) {
    if (!isCardClickable) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-card-expandable-stop]')) {
      return;
    }
    row.toggleExpanded();
  }

  return (
    <div
      className={clsx(
        'flex flex-col overflow-hidden rounded-lg border border-solid border-[color:var(--border-widget)] bg-[color:var(--bg-card-color)] transition-colors',
        {
          'hover:border-[color:var(--ui-blue-3,#338ddd)]': !isExpanded,
        }
      )}
    >
      <div
        className={clsx('flex flex-col gap-2 px-4 py-3', {
          'cursor-pointer': isCardClickable,
          'border-b border-solid border-[color:var(--border-widget)]':
            isExpanded,
        })}
        onClick={isCardClickable ? handleCardClick : undefined}
        onKeyDown={
          isCardClickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(e);
                }
              }
            : undefined
        }
        role={isCardClickable ? 'button' : undefined}
        tabIndex={isCardClickable ? 0 : undefined}
      >
        <div className="flex flex-wrap items-center gap-3">
          {selectCell && (
            <div className="flex items-center" data-card-expandable-stop>
              {flexRender(
                selectCell.column.columnDef.cell,
                selectCell.getContext()
              )}
            </div>
          )}
          {canExpand && (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border-none bg-transparent p-1 text-[color:var(--text-main-color)] hover:bg-[color:var(--bg-hover-table-color,rgba(51,141,221,0.1))]"
              onClick={(e) => {
                e.stopPropagation();
                row.toggleExpanded();
              }}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <Icon
                icon={ChevronDown}
                size="md"
                className={clsx('transition-transform', {
                  'rotate-180': isExpanded,
                })}
              />
            </button>
          )}
          {titleCell && (
            <div className="flex min-w-0 flex-auto items-center gap-2 font-medium text-[color:var(--text-main-color)]">
              {flexRender(
                titleCell.column.columnDef.cell,
                titleCell.getContext()
              )}
            </div>
          )}
          {actionCells.length > 0 && (
            <div
              className="ml-auto flex items-center gap-2"
              data-card-expandable-stop
            >
              {actionCells.map((cell) => (
                <div key={cell.id} className="flex items-center">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          )}
        </div>
        {metaCells.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 pl-9 text-xs text-[color:var(--text-summary-color,var(--text-main-color))]">
            {metaCells.map((cell) => {
              const label = getColumnHeaderText(cell);
              return (
                <div
                  key={cell.id}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  {label && <span className="opacity-70">{label}</span>}
                  <span className="inline-flex items-center gap-1 text-[color:var(--text-main-color)]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {isExpanded && (
        <div className="bg-[color:var(--bg-card-color)] py-3">
          {renderSubRow(row)}
        </div>
      )}
    </div>
  );
}

function groupCells<D extends DefaultType>(cells: Cell<D, unknown>[]) {
  let selectCell: Cell<D, unknown> | undefined;
  const dataCells: Cell<D, unknown>[] = [];
  for (const cell of cells) {
    if (cell.column.id === 'select') {
      selectCell = cell;
    } else if (cell.column.id !== 'expand') {
      dataCells.push(cell);
    }
  }
  return { selectCell, dataCells };
}

function splitDataCells<D extends DefaultType>(cells: Cell<D, unknown>[]) {
  if (cells.length === 0) {
    return {
      titleCell: undefined,
      actionCells: [] as Cell<D, unknown>[],
      metaCells: [] as Cell<D, unknown>[],
    };
  }
  const titleCell = cells[0];
  const remaining = cells.slice(1);
  let actionStart = remaining.length;
  for (let i = remaining.length - 1; i >= 0; i--) {
    if (isActionLikeColumn(remaining[i])) {
      actionStart = i;
    } else {
      break;
    }
  }
  return {
    titleCell,
    metaCells: remaining.slice(0, actionStart),
    actionCells: remaining.slice(actionStart),
  };
}

function isActionLikeColumn<D extends DefaultType>(cell: Cell<D, unknown>) {
  const { id } = cell.column;
  if (id === 'actions' || id.endsWith('-actions') || id.endsWith('_actions')) {
    return true;
  }
  const header = cell.column.columnDef.header;
  if (header == null) {
    return true;
  }
  if (typeof header === 'string' && header.trim() === '') {
    return true;
  }
  return false;
}

function getColumnHeaderText<D extends DefaultType>(cell: Cell<D, unknown>) {
  const header = cell.column.columnDef.header;
  return typeof header === 'string' && header.trim() !== '' ? header : null;
}
