import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage, LanguageSupport } from '@codemirror/language';
import { yaml } from '@codemirror/legacy-modes/mode/yaml';
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { useMemo, useState } from 'react';
import { createTheme } from '@uiw/codemirror-themes';
import { tags as highlightTags } from '@lezer/highlight';

import { AutomationTestingProps } from '@/types';

import { CopyButton } from '@@/buttons/CopyButton';

import styles from './CodeEditor.module.css';
import { TextTip } from './Tip/TextTip';
import { StackVersionSelector } from './StackVersionSelector';

interface Props extends AutomationTestingProps {
  id: string;
  placeholder?: string;
  yaml?: boolean;
  dockerFile?: boolean;
  shell?: boolean;
  readonly?: boolean;
  onChange: (value: string) => void;
  value: string;
  height?: string;
  versions?: number[];
  onVersionChange?: (version: number) => void;
}

const theme = createTheme({
  theme: 'light',
  settings: {
    background: 'var(--bg-codemirror-color)',
    foreground: 'var(--text-codemirror-color)',
    caret: 'var(--border-codemirror-cursor-color)',
    selection: 'var(--bg-codemirror-selected-color)',
    selectionMatch: 'var(--bg-codemirror-selected-color)',
    gutterBackground: 'var(--bg-codemirror-gutters-color)',
  },
  styles: [
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

const yamlLanguage = new LanguageSupport(StreamLanguage.define(yaml));
const dockerFileLanguage = new LanguageSupport(
  StreamLanguage.define(dockerFile)
);
const shellLanguage = new LanguageSupport(StreamLanguage.define(shell));

export function CodeEditor({
  id,
  onChange,
  placeholder,
  readonly,
  value,
  versions,
  onVersionChange,
  height = '500px',
  yaml: isYaml,
  dockerFile: isDockerFile,
  shell: isShell,
  'data-cy': dataCy,
}: Props) {
  const [isRollback, setIsRollback] = useState(false);

  const extensions = useMemo(() => {
    const extensions = [];
    if (isYaml) {
      extensions.push(yamlLanguage);
    }
    if (isDockerFile) {
      extensions.push(dockerFileLanguage);
    }
    if (isShell) {
      extensions.push(shellLanguage);
    }
    return extensions;
  }, [isYaml, isDockerFile, isShell]);

  function handleVersionChange(version: number) {
    if (versions && versions.length > 1) {
      if (version < versions[0]) {
        setIsRollback(true);
      } else {
        setIsRollback(false);
      }
    }

    onVersionChange?.(version);
  }

  return (
    <>
      <div className="mb-2 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {!!placeholder && <TextTip color="blue">{placeholder}</TextTip>}
          </div>

          <div className="flex-2 ml-auto mr-2 flex items-center gap-x-2">
            <CopyButton
              data-cy={`copy-code-button-${id}`}
              fadeDelay={2500}
              copyText={value}
              color="link"
              className="!pr-0 !text-sm !font-medium hover:no-underline focus:no-underline"
              indicatorPosition="left"
            >
              Copy to clipboard
            </CopyButton>
          </div>
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
      <CodeMirror
        className={styles.root}
        theme={theme}
        value={value}
        onChange={onChange}
        readOnly={readonly || isRollback}
        id={id}
        extensions={extensions}
        height={height}
        basicSetup={{
          highlightSelectionMatches: false,
          autocompletion: false,
        }}
        data-cy={dataCy}
      />
    </>
  );
}
