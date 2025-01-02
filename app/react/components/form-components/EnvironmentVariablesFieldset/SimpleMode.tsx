import { Edit, Plus } from 'lucide-react';
import { useState } from 'react';

import { readFileAsText } from '@/portainer/services/fileUploadReact';

import { Button } from '@@/buttons';
import { TextTip } from '@@/Tip/TextTip';
import { FileUploadField } from '@@/form-components/FileUpload';
import { InputList } from '@@/form-components/InputList';
import { ArrayError } from '@@/form-components/InputList/InputList';

import type { Values } from './types';
import { parseDotEnvFile } from './utils';
import { EnvironmentVariableItem } from './EnvironmentVariableItem';

export function SimpleMode({
  value,
  onChange,
  onAdvancedModeClick,
  errors,
  canUndoDelete,
}: {
  value: Values;
  onChange: (value: Values) => void;
  onAdvancedModeClick: () => void;
  errors?: ArrayError<Values>;
  canUndoDelete?: boolean;
}) {
  return (
    <>
      <Button
        size="small"
        color="link"
        icon={Edit}
        className="!ml-0 p-0 hover:no-underline"
        onClick={onAdvancedModeClick}
        data-cy="environment-variables-advanced-mode-button"
      >
        Advanced mode
      </Button>

      <TextTip color="blue" inline={false}>
        Switch to advanced mode to copy & paste multiple variables
      </TextTip>

      <InputList
        aria-label="environment variables list"
        onChange={onChange}
        value={value}
        isAddButtonHidden
        item={EnvironmentVariableItem}
        errors={errors}
        canUndoDelete={canUndoDelete}
        data-cy="simple-environment-variable-fieldset"
      />

      <div className="flex gap-2">
        <Button
          onClick={() =>
            onChange([...value, { name: '', value: '', needsDeletion: false }])
          }
          className="!ml-0"
          color="default"
          icon={Plus}
          data-cy="add-environment-variable-button"
        >
          Add an environment variable
        </Button>

        <FileEnv onChooseFile={(add) => onChange([...value, ...add])} />
      </div>
    </>
  );
}

function FileEnv({ onChooseFile }: { onChooseFile: (file: Values) => void }) {
  const [file, setFile] = useState<File | null>(null);

  const fileTooBig = file && file.size > 1024 * 1024;

  return (
    <>
      <FileUploadField
        inputId="env-file-upload"
        onChange={handleChange}
        title="Load variables from .env file"
        accept=".env"
        value={file}
        color="default"
        data-cy="load-environment-variables-from-file-button"
      />

      {fileTooBig && (
        <TextTip color="orange" inline>
          File too large! Try uploading a file smaller than 1MB
        </TextTip>
      )}
    </>
  );

  async function handleChange(file: File) {
    setFile(file);
    if (!file) {
      return;
    }

    const text = await readFileAsText(file);
    if (!text) {
      return;
    }

    const parsed = parseDotEnvFile(text);
    onChooseFile(parsed);
  }
}
