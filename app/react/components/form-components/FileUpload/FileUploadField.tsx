import { ChangeEvent, ComponentProps, createRef } from 'react';
import { Upload, XCircle } from 'lucide-react';

import { AutomationTestingProps } from '@/types';

import { Button } from '@@/buttons';
import { Icon } from '@@/Icon';

import styles from './FileUploadField.module.css';

export interface Props extends AutomationTestingProps {
  onChange(value: File): void;
  value?: File | null;
  accept?: string;
  title?: string;
  required?: boolean;
  inputId: string;
  color?: ComponentProps<typeof Button>['color'];
  name?: string;
}

export function FileUploadField({
  onChange,
  value,
  accept,
  title = 'Select a file',
  required = false,
  inputId,
  color = 'primary',
  name,
  'data-cy': dataCy,
}: Props) {
  const fileRef = createRef<HTMLInputElement>();

  return (
    <div className="file-upload-field flex gap-2">
      <input
        id={inputId}
        ref={fileRef}
        type="file"
        accept={accept}
        required={required}
        className={styles.fileInput}
        onChange={changeHandler}
        aria-label="file-input"
        name={name}
      />
      <Button
        size="small"
        color={color}
        onClick={handleButtonClick}
        className={styles.fileButton}
        data-cy={dataCy}
        icon={Upload}
      >
        {title}
      </Button>

      <span className="vertical-center">
        {value ? value.name : required && <Icon icon={XCircle} mode="danger" />}
      </span>
    </div>
  );

  function handleButtonClick() {
    if (fileRef && fileRef.current) {
      fileRef.current.click();
    }
  }

  function changeHandler(event: ChangeEvent<HTMLInputElement>) {
    if (event.target && event.target.files && event.target.files.length > 0) {
      onChange(event.target.files[0]);
    }
  }
}
