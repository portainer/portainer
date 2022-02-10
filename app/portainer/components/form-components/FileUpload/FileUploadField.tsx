import { ChangeEvent, createRef } from 'react';

import { r2a } from '@/react-tools/react2angular';
import { Button } from '@/portainer/components/Button';

import styles from './FileUploadField.module.css';

export interface Props {
  onChange(value: File): void;
  value?: File;
  accept?: string;
  title?: string;
  required?: boolean;
}

export function FileUploadField({
  onChange,
  value,
  accept,
  title = 'Select a file',
  required = false,
}: Props) {
  const fileRef = createRef<HTMLInputElement>();

  return (
    <div className="file-upload-field">
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        required={required}
        className={styles.fileInput}
        onChange={changeHandler}
        aria-label="file-input"
      />
      <Button
        size="small"
        color="primary"
        onClick={handleButtonClick}
        className={styles.fileButton}
      >
        {title}
      </Button>

      <span className="space-left">
        {value ? (
          value.name
        ) : (
          <i className="fa fa-times red-icon" aria-hidden="true" />
        )}
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

export const FileUploadFieldAngular = r2a(FileUploadField, [
  'onChange',
  'value',
  'title',
  'required',
]);
