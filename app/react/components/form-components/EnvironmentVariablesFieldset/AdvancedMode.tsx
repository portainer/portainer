import { List } from 'lucide-react';

import { CodeEditor } from '@@/CodeEditor';
import { TextTip } from '@@/Tip/TextTip';
import { Button } from '@@/buttons';

import { convertToArrayOfStrings, parseDotEnvFile } from './utils';
import { type Value } from './types';

export function AdvancedMode({
  value,
  onChange,
  onSimpleModeClick,
}: {
  value: Value;
  onChange: (value: Value) => void;
  onSimpleModeClick: () => void;
}) {
  const editorValue = convertToArrayOfStrings(value).join('\n');

  return (
    <>
      <Button
        size="small"
        color="link"
        icon={List}
        className="!ml-0 p-0 hover:no-underline"
        onClick={onSimpleModeClick}
      >
        Simple mode
      </Button>

      <TextTip color="blue" inline={false}>
        Switch to simple mode to define variables line by line, or load from
        .env file
      </TextTip>

      <CodeEditor
        id="environment-variables-editor"
        value={editorValue}
        onChange={handleEditorChange}
        placeholder="e.g. key=value"
      />
    </>
  );

  function handleEditorChange(value: string) {
    onChange(parseDotEnvFile(value));
  }
}
