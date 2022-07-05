import { Table as MainComponent } from './Table';
import { TableActions } from './TableActions';
import { TableTitleActions } from './TableTitleActions';
import { TableHeaderCell } from './TableHeaderCell';
import { TableSettingsMenu } from './TableSettingsMenu';
import { TableTitle } from './TableTitle';
import { TableContainer } from './TableContainer';
import { TableHeaderRow } from './TableHeaderRow';
import { TableRow } from './TableRow';
import { TableContent } from './TableContent';
import { TableFooter } from './TableFooter';

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

const Table: typeof MainComponent & SubComponents =
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

export {
  Table,
  TableActions,
  TableTitleActions,
  TableHeaderCell,
  TableSettingsMenu,
  TableTitle,
  TableContainer,
  TableHeaderRow,
  TableRow,
};
