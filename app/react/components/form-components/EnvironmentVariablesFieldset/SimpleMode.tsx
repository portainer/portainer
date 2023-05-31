import { Edit, Plus } from 'lucide-react';
import { useState } from 'react';

import { readFileAsText } from '@/portainer/services/fileUploadReact';

import { Button } from '@@/buttons';
import { TextTip } from '@@/Tip/TextTip';
import { FileUploadField } from '@@/form-components/FileUpload';
import { InputList } from '@@/form-components/InputList';
import { ArrayError, ItemProps } from '@@/form-components/InputList/InputList';
import { InputLabeled } from '@@/form-components/Input/InputLabeled';

import { FormError } from '../FormError';

import { type EnvVar, type Value } from './types';
import { parseDotEnvFile } from './utils';

export function SimpleMode({
  value,
  onChange,
  onAdvancedModeClick,
  errors,
}: {
  value: Value;
  onChange: (value: Value) => void;
  onAdvancedModeClick: () => void;
  errors?: ArrayError<Value>;
}) {
  return (
    <>
      <Button
        size="small"
        color="link"
        icon={Edit}
        className="!ml-0 p-0 hover:no-underline"
        onClick={onAdvancedModeClick}
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
        item={Item}
        errors={errors}
      />

      <div className="flex gap-2">
        <Button
          onClick={() => onChange([...value, { name: '', value: '' }])}
          color="default"
          icon={Plus}
        >
          Add an environment variable
        </Button>

        <FileEnv onChooseFile={(add) => onChange([...value, ...add])} />
      </div>
    </>
  );
}

function Item({
  item,
  onChange,
  disabled,
  error,
  readOnly,
  index,
}: ItemProps<EnvVar>) {
  return (
    <div className="relative flex w-full flex-col">
      <div className="flex w-full items-center gap-2">
        <InputLabeled
          className="w-1/2"
          label="name"
          value={item.name}
          onChange={(e) => handleChange({ name: e.target.value })}
          disabled={disabled}
          readOnly={readOnly}
          placeholder="e.g. FOO"
          size="small"
          id={`env-name${index}`}
        />
        <InputLabeled
          className="w-1/2"
          label="value"
          value={item.value}
          onChange={(e) => handleChange({ value: e.target.value })}
          disabled={disabled}
          readOnly={readOnly}
          placeholder="e.g. bar"
          size="small"
          id={`env-value${index}`}
        />
      </div>

      {!!error && (
        <div className="absolute -bottom-5">
          <FormError className="m-0">{Object.values(error)[0]}</FormError>
        </div>
      )}
    </div>
  );

  function handleChange(partial: Partial<EnvVar>) {
    onChange({ ...item, ...partial });
  }
}

function FileEnv({ onChooseFile }: { onChooseFile: (file: Value) => void }) {
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
