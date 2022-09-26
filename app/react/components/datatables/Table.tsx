import clsx from 'clsx';
import { PropsWithChildren } from 'react';
import { TableProps } from 'react-table';

import { TableContainer } from './TableContainer';
import { TableActions } from './TableActions';
import { TableTitleActions } from './TableTitleActions';
import { TableContent } from './TableContent';
import { TableHeaderCell } from './TableHeaderCell';
import { TableSettingsMenu } from './TableSettingsMenu';
import { TableTitle } from './TableTitle';
import { TableHeaderRow } from './TableHeaderRow';
import { TableRow } from './TableRow';
import { TableFooter } from './TableFooter';

function MainComponent({
  children,
  className,
  role,
  style,
}: PropsWithChildren<TableProps>) {
  return (
    <div className="table-responsive">
      <table
        className={clsx(
          'table table-hover table-filters nowrap-cells',
          className
        )}
        role={role}
        style={style}
      >
        {children}
      </table>
    </div>
  );
}

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
