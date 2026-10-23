import { X } from 'lucide-react';

import { pluralize } from '@/react/common/string-utils';

import { Badge } from '@@/Badge';

interface Props {
  selected: Set<string>;
  removeFile: (path: string) => void;
}

export function SelectedPanel({ selected, removeFile }: Props) {
  const selectedPaths = Array.from(selected).sort();

  return (
    <>
      <div className="shrink-0 border-b border-l-0 border-r-0 border-t-0 border-solid border-gray-4 px-3 py-2.5 text-sm font-semibold text-gray-11 th-highcontrast:border-white th-highcontrast:text-white th-dark:border-gray-7 th-dark:text-white">
        {selected.size} Selected {pluralize(selected.size, 'File')}
      </div>
      <div className="flex-1 overflow-y-auto">
        {selectedPaths.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-gray-6 th-highcontrast:text-gray-5 th-dark:text-gray-5">
            No files selected
          </p>
        ) : (
          selectedPaths.map((path) => (
            <FileRow key={path} path={path} onRemove={() => removeFile(path)} />
          ))
        )}
      </div>
    </>
  );
}

interface FileRowProps {
  path: string;
  onRemove: () => void;
}

function FileRow({ path, onRemove }: FileRowProps) {
  return (
    <div className="flex items-center gap-2 border-b border-l-0 border-r-0 border-t-0 border-solid border-gray-4 bg-blue-1 px-3 py-2.5 th-highcontrast:border-white th-highcontrast:bg-gray-iron-10 th-dark:border-gray-7 th-dark:bg-blue-11">
      <Badge type="infoSecondary" shape="rect" size="sm" className="uppercase">
        File
      </Badge>
      <span
        className="min-w-0 flex-1 truncate font-mono text-xs text-gray-11 th-highcontrast:text-white th-dark:text-white"
        title={`/${path}`}
      >
        /{path}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="flex shrink-0 items-center justify-center rounded border-0 bg-transparent p-0.5 text-gray-6 hover:text-gray-9 th-highcontrast:text-white th-dark:text-gray-6"
        aria-label={`Remove file /${path}`}
      >
        <X size={12} />
      </button>
    </div>
  );
}
