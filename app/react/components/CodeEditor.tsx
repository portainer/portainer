import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { yaml } from '@codemirror/legacy-modes/mode/yaml';
import { useMemo } from 'react';

interface Props {
  id: string;
  placeholder?: string;
  yaml?: boolean;
  readonly?: boolean;
  onChange: (value: string) => void;
  value: string;
  height?: string;
}

export function CodeEditor({
  id,
  onChange,
  placeholder,
  readonly,
  value,
  height = '500px',
  yaml: isYaml,
}: Props) {
  const extensions = useMemo(
    () => (isYaml ? [StreamLanguage.define(yaml)] : []),
    [isYaml]
  );

  return (
    <CodeMirror
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
