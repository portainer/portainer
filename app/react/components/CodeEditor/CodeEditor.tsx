import CodeMirror from '@uiw/react-codemirror';
import { AriaAttributes, useCallback, useState } from 'react';
import { createTheme } from '@uiw/codemirror-themes';
import { tags as highlightTags } from '@lezer/highlight';
import type { JSONSchema7 } from 'json-schema';
import clsx from 'clsx';

import { AutomationTestingProps } from '@/types';

import { CopyButton } from '@@/buttons/CopyButton';

import { useDebounce } from '../../hooks/useDebounce';
import { TextTip } from '../Tip/TextTip';
import { StackVersionSelector } from '../StackVersionSelector';

import styles from './CodeEditor.module.css';
import {
  useCodeEditorExtensions,
  CodeEditorType,
} from './useCodeEditorExtensions';
import { FileNameHeader, FileNameHeaderRow } from './FileNameHeader';

interface Props extends AutomationTestingProps {
  id: string;
  textTip?: string;
  type?: CodeEditorType;
  readonly?: boolean;
  onChange?: (value: string) => void;
  value: string;
  height?: string;
  versions?: number[];
  onVersionChange?: (version: number) => void;
  schema?: JSONSchema7;
  fileName?: string;
  placeholder?: string;
  showToolbar?: boolean;
}

export const theme = createTheme({
  theme: 'light',
  settings: {
    background: 'var(--bg-codemirror-color)',
    foreground: 'var(--text-codemirror-color)',
    caret: 'var(--border-codemirror-cursor-color)',
    selection: 'var(--bg-codemirror-selected-color)',
    selectionMatch: 'var(--bg-codemirror-selected-color)',
  },
  styles: [
    {
      tag: [highlightTags.propertyName, highlightTags.attributeName],
      color: 'var(--text-cm-default-color)',
    },
    { tag: highlightTags.atom, color: 'var(--text-cm-default-color)' },
    { tag: highlightTags.meta, color: 'var(--text-cm-meta-color)' },
    {
      tag: [highlightTags.string, highlightTags.special(highlightTags.brace)],
      color: 'var(--text-cm-string-color)',
    },
    { tag: highlightTags.number, color: 'var(--text-cm-number-color)' },
    { tag: highlightTags.keyword, color: 'var(--text-cm-keyword-color)' },
    { tag: highlightTags.comment, color: 'var(--text-cm-comment-color)' },
    {
      tag: highlightTags.variableName,
      color: 'var(--text-cm-variable-name-color)',
    },
  ],
});

export function CodeEditor({
  id,
  onChange = () => {},
  textTip,
  readonly,
  value,
  versions,
  onVersionChange,
  height = '500px',
  type,
  schema,
  'data-cy': dataCy,
  fileName,
  placeholder,
  showToolbar = true,
  'aria-label': ariaLabel,
}: Props & Pick<AriaAttributes, 'aria-label'>) {
  const [isRollback, setIsRollback] = useState(false);

  const extensions = useCodeEditorExtensions(type, schema);

  const handleVersionChange = useCallback(
    (version: number) => {
      if (versions && versions.length > 1) {
        setIsRollback(version < versions[0]);
      }
      onVersionChange?.(version);
    },
    [onVersionChange, versions]
  );

  const [debouncedValue, debouncedOnChange] = useDebounce(value, onChange);

  return (
    <>
      {showToolbar && (
        <div className="mb-2 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {!!textTip && <TextTip color="blue">{textTip}</TextTip>}
            </div>
            {/* the copy button is in the file name header, when fileName is provided */}
            {!fileName && (
              <div className="flex-2 ml-auto mr-2 flex items-center gap-x-2">
                <CopyButton
                  data-cy={`copy-code-button-${id}`}
                  fadeDelay={2500}
                  copyText={value}
                  color="link"
                  className="!pr-0 !text-sm !font-medium hover:no-underline focus:no-underline"
                  indicatorPosition="left"
                >
                  Copy
                </CopyButton>
              </div>
            )}
          </div>
          {versions && (
            <div className="mt-2 flex">
              <div className="ml-auto mr-2">
                <StackVersionSelector
                  versions={versions}
                  onChange={handleVersionChange}
                />
              </div>
            </div>
          )}
        </div>
      )}
      <div className="overflow-hidden rounded-lg border border-solid border-gray-5 th-highcontrast:border-gray-2 th-dark:border-gray-7">
        {fileName && (
          <FileNameHeaderRow>
            <FileNameHeader
              fileName={fileName}
              copyText={value}
              data-cy={`copy-code-button-${id}`}
            />
          </FileNameHeaderRow>
        )}
        <CodeMirror
          className={clsx(styles.root, styles.codeEditor)}
          theme={theme}
          value={debouncedValue}
          onChange={debouncedOnChange}
          readOnly={readonly || isRollback}
          id={id}
          extensions={extensions}
          height={height}
          basicSetup={{
            highlightSelectionMatches: false,
            autocompletion: !!schema,
          }}
          data-cy={dataCy}
          placeholder={placeholder}
          aria-label={ariaLabel || 'Code Editor'}
        />
      </div>
    </>
  );
}
