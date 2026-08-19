import CodeMirrorMerge from 'react-codemirror-merge';
import clsx from 'clsx';

import { AutomationTestingProps } from '@/types';

import { FileNameHeader, FileNameHeaderRow } from './FileNameHeader';
import styles from './CodeEditor.module.css';
import {
  CodeEditorType,
  useCodeEditorExtensions,
} from './useCodeEditorExtensions';
import { theme } from './CodeEditor';

const { Original } = CodeMirrorMerge;
const { Modified } = CodeMirrorMerge;

type Props = {
  originalCode: string;
  newCode: string;
  id: string;
  type?: CodeEditorType;
  placeholder?: string;
  height?: string;
  fileNames?: {
    original: string;
    modified: string;
  };
  className?: string;
} & AutomationTestingProps;

const defaultCollapseUnchanged = {
  margin: 10,
  minSize: 10,
};

export function DiffViewer({
  originalCode,
  newCode,
  id,
  'data-cy': dataCy,
  type,
  placeholder = 'No values found',

  height = '500px',
  fileNames,
  className,
}: Props) {
  const extensions = useCodeEditorExtensions(type);
  const hasFileNames = !!fileNames?.original && !!fileNames?.modified;
  return (
    <div
      className={clsx(
        'overflow-hidden rounded-lg border border-solid border-gray-5 th-highcontrast:border-gray-2 th-dark:border-gray-7',
        className
      )}
    >
      {hasFileNames && (
        <DiffFileNameHeaders
          originalCopyText={originalCode}
          modifiedCopyText={newCode}
          originalFileName={fileNames.original}
          modifiedFileName={fileNames.modified}
        />
      )}
      {/* additional div, so that the scroll gutter doesn't overlap with the rounded border, and always show scrollbar, so that the file name headers align */}
      <div
        style={
          {
            // tailwind doesn't like dynamic class names, so use a custom css variable for the height
            // https://v3.tailwindcss.com/docs/content-configuration#dynamic-class-names
            '--editor-min-height': height,
            height,
          } as React.CSSProperties
        }
        className="h-full overflow-y-scroll [scrollbar-gutter:stable]"
      >
        <CodeMirrorMerge
          theme={theme}
          className={clsx(
            styles.root,
            // to give similar sizing to CodeEditor
            '[&_.cm-content]:!min-h-[var(--editor-min-height)] [&_.cm-editor>.cm-scroller]:!min-h-[var(--editor-min-height)] [&_.cm-gutters]:!min-h-[var(--editor-min-height)]'
          )}
          id={id}
          data-cy={dataCy}
          collapseUnchanged={defaultCollapseUnchanged}
        >
          <Original
            value={originalCode}
            extensions={extensions}
            readOnly
            editable={false}
            placeholder={placeholder}
          />
          <Modified
            value={newCode}
            extensions={extensions}
            readOnly
            editable={false}
            placeholder={placeholder}
          />
        </CodeMirrorMerge>
      </div>
    </div>
  );
}

function DiffFileNameHeaders({
  originalCopyText,
  modifiedCopyText,
  originalFileName,
  modifiedFileName,
}: {
  originalCopyText: string;
  modifiedCopyText: string;
  originalFileName: string;
  modifiedFileName: string;
}) {
  return (
    <FileNameHeaderRow>
      <div className="w-1/2">
        <FileNameHeader
          fileName={originalFileName}
          copyText={originalCopyText}
          data-cy="original"
        />
      </div>
      <div className="w-px bg-gray-5 th-highcontrast:bg-gray-2 th-dark:bg-gray-7" />
      <div className="flex-1">
        <FileNameHeader
          fileName={modifiedFileName}
          copyText={modifiedCopyText}
          data-cy="modified"
        />
      </div>
    </FileNameHeaderRow>
  );
}
