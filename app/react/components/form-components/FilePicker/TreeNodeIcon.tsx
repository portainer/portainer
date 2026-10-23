import { File as FileIcon, Folder } from 'lucide-react';

import { isDirectory } from '@@/form-components/FilePicker/utils';

import { Directory, File } from './types';

interface Props {
  node: Directory | File;
}

export function TreeNodeIcon({ node }: Props) {
  return isDirectory(node) ? (
    <Folder
      size={14}
      className="shrink-0 text-blue-7 th-highcontrast:text-white th-dark:text-blue-5"
    />
  ) : (
    <FileIcon
      size={14}
      className="shrink-0 text-gray-7 th-highcontrast:text-white th-dark:text-gray-5"
    />
  );
}
