export type FileNode = Directory | File;

export interface File {
  name: string;
}

export interface Directory {
  name: string;
  children?: FileNode[];
}
