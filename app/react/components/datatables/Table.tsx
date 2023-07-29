import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { AutomationTestingProps } from '@/types';

import { TableContainer } from './TableContainer';
import { TableActions } from './TableActions';
import { TableFooter } from './TableFooter';
import { TableTitleActions } from './TableTitleActions';
import { TableSettingsMenu } from './TableSettingsMenu';
import { TableTitle } from './TableTitle';
import { TableContent } from './TableContent';
import { TableHeaderCell } from './TableHeaderCell';
import { TableHeaderRow } from './TableHeaderRow';
import { TableRow } from './TableRow';

interface Props extends AutomationTestingProps {
  className?: string;
}

function MainComponent({
  children,
  className,
  'data-cy': dataCy,
}: PropsWithChildren<Props>) {
  return (
    <div className="table-responsive">
      <table
        data-cy={dataCy}
        className={clsx(
          'table-hover table-filters nowrap-cells table',
          className
        )}
      >
        {children}
      </table>
    </div>
  );
}

MainComponent.displayName = 'Table';

interface SubComponents {
  Container: typeof TableContainer;
  Actions: typeof TableActions;
  TitleActions: typeof TableTitleActions;
  HeaderCell: typeof TableHeaderCell;
  SettingsMenu: typeof TableSettingsMenu;
  Title: typeof TableTitle;
  Row: typeof TableRow;
  HeaderRow: typeof TableHeaderRow;
  Content: typeof TableContent;
  Footer: typeof TableFooter;
}

export const Table: typeof MainComponent & SubComponents =
  MainComponent as typeof MainComponent & SubComponents;

Table.Actions = TableActions;
Table.TitleActions = TableTitleActions;
Table.Container = TableContainer;
Table.HeaderCell = TableHeaderCell;
Table.SettingsMenu = TableSettingsMenu;
Table.Title = TableTitle;
Table.Row = TableRow;
Table.HeaderRow = TableHeaderRow;
Table.Content = TableContent;
Table.Footer = TableFooter;
