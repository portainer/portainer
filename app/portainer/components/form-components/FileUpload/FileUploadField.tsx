import {
  ChangeEvent,
  createRef,
  PropsWithChildren,
  ReactNode,
  useState,
} from 'react';

import { r2a } from '@/react-tools/react2angular';
import { Button } from '@/portainer/components/Button';

import styles from './FileUploadForm.module.css';

export interface Props {
  onChange(value: unknown): void;
  children?: ReactNode;
  file?: File;
  required?: boolean;
}

export function FileUploadField({
  required = false,
  children = 'Select a file',
  onChange,
  file,
}: PropsWithChildren<Props>) {
  const fileRef = createRef<HTMLInputElement>();
  function handleButtonClick() {
    if (fileRef && fileRef.current) {
      fileRef.current.click();
    }
  }

  const [selectedFile, setSelectedFile] = useState(file);
  function changeHandler(event: ChangeEvent<HTMLInputElement>) {
    if (event.target && event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      onChange(file);
    }
  }

  return (
    <div className="file-upload-field">
      <input
        ref={fileRef}
        type="file"
        required={required}
        className={styles.fileInput}
        onChange={changeHandler}
      />
      <Button
        type="button"
        className="btn btn-sm btn-primary"
        onClick={handleButtonClick}
      >
        {children}
      </Button>

      <span className="space-left">
        {selectedFile ? (
          selectedFile.name
        ) : (
          <i className="fa fa-times red-icon" aria-hidden="true" />
        )}
      </span>
    </div>
  );
}

export const FileUploadFieldAngular = r2a(FileUploadField, [
  'required',
  'children',
  'onChange',
  'file',
]);
