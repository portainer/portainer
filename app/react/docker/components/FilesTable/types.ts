import { ReactNode } from 'react';

export type FileData = {
  Name: string;
  Dir: boolean;
  Size: number;
  ModTime: number;
  custom: ReactNode;
};
