import { List } from 'lucide-react';

import { AutomationTestingProps } from '@/types';

import { CodeEditor } from '@@/CodeEditor';
import { TextTip } from '@@/Tip/TextTip';
import { Button } from '@@/buttons';

import { convertToArrayOfStrings, parseDotEnvFile } from './utils';
import { type Values } from './types';

export function AdvancedMode({
  value,
  onChange,
  onSimpleModeClick,
  'data-cy': dataCy,
}: {
  value: Values;
  onChange: (value: Values) => void;
  onSimpleModeClick: () => void;
} & AutomationTestingProps) {
  const editorValue = convertToArrayOfStrings(value).join('\n');

  return (
    <>
      <Button
        size="small"
        color="link"
        icon={List}
        className="!ml-0 p-0 hover:no-underline"
        onClick={onSimpleModeClick}
        data-cy="env-simple-mode-button"
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
        textTip="e.g. key=value"
        data-cy={dataCy}
      />
    </>
  );

  function handleEditorChange(value: string) {
    onChange(parseDotEnvFile(value));
  }
}
