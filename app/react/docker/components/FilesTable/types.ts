import { TableMeta } from '@tanstack/react-table';
import { ReactNode } from 'react';

export type FileData = {
  Name: string;
  Dir: boolean;
  Size: number;
  ModTime: number;
  custom: ReactNode;
};

export type FilesTableMeta = TableMeta<FileData> & {
  table: 'files';
  isEdit(rowId: string): boolean;
  setIsEdit(rowId: string, isEdit: boolean): void;
  onRename: (oldName: string, newName: string) => void;
  onBrowse: (name: string) => void;
  onDownload: (fileName: string) => void;
  onDelete: (fileName: string) => void;
};

export function isFilesTableMeta(
  meta?: TableMeta<FileData>
): meta is FilesTableMeta {
  return !!meta && meta.table === 'files';
}
