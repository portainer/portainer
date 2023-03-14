import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage, LanguageSupport } from '@codemirror/language';
import { yaml } from '@codemirror/legacy-modes/mode/yaml';
import { useMemo } from 'react';
import { createTheme } from '@uiw/codemirror-themes';
import { tags as highlightTags } from '@lezer/highlight';

import styles from './CodeEditor.module.css';

interface Props {
  id: string;
  placeholder?: string;
  yaml?: boolean;
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
  ],
});

const yamlLanguage = new LanguageSupport(StreamLanguage.define(yaml));

export function CodeEditor({
  id,
  onChange,
  placeholder,
  readonly,
  value,
  height = '500px',
  yaml: isYaml,
}: Props) {
  const extensions = useMemo(() => (isYaml ? [yamlLanguage] : []), [isYaml]);

  return (
    <CodeMirror
      className={styles.root}
      theme={theme}
      value={value}
      onChange={onChange}
      readOnly={readonly}
      placeholder={placeholder}
      id={id}
      extensions={extensions}
      height={height}
    />
  );
}
