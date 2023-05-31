import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage, LanguageSupport } from '@codemirror/language';
import { yaml } from '@codemirror/legacy-modes/mode/yaml';
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { useMemo } from 'react';
import { createTheme } from '@uiw/codemirror-themes';
import { tags as highlightTags } from '@lezer/highlight';

import { CopyButton } from '@@/buttons/CopyButton';

import styles from './CodeEditor.module.css';
import { TextTip } from './Tip/TextTip';

interface Props {
  id: string;
  placeholder?: string;
  yaml?: boolean;
  dockerFile?: boolean;
  shell?: boolean;
  readonly?: boolean;
  onChange: (value: string) => void;
  value: string;
  height?: string;
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
  height = '500px',
  yaml: isYaml,
  dockerFile: isDockerFile,
  shell: isShell,
}: Props) {
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

  return (
    <>
      <div className="mb-2 flex flex-col">
        <div className="flex">
          <div className="flex-1">
            {!!placeholder && <TextTip color="blue">{placeholder}</TextTip>}
          </div>

          <div className="ml-auto">
            <CopyButton
              copyText={value}
              color="none"
              className="!text-sm !font-medium text-blue-9 hover:!text-blue-11 th-highcontrast:text-blue-7 hover:th-highcontrast:!text-blue-6 th-dark:text-blue-7 hover:th-dark:!text-blue-6"
              indicatorPosition="left"
            >
              Copy to clipboard
            </CopyButton>
          </div>
        </div>
      </div>
      <CodeMirror
        className={styles.root}
        theme={theme}
        value={value}
        onChange={onChange}
        readOnly={readonly}
        id={id}
        extensions={extensions}
        height={height}
        basicSetup={{
          highlightSelectionMatches: false,
          autocompletion: false,
        }}
      />
    </>
  );
}
