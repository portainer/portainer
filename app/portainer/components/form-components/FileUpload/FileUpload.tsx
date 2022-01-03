// @ts-nocheck
import { createRef, PropsWithChildren, ReactNode, useState } from 'react';
import { r2a } from '@/react-tools/react2angular';

import styles from './FileUpload.module.css';

export interface Props {
  required?: boolean;
  onChange(value: unknown): void;
  children: ReactNode;
}

export function FileUpload({
  required = false,
  onChange,
  children,
}: PropsWithChildren<Props>) {
  const fileRef = createRef<HTMLInputElement>();

  const [selectedFile, setSelectedFile] = useState();
  const changeHandler = (event: unknown) => {
    const file = event.target.files[0];
    console.log(file.name);
    setSelectedFile(file);
    onChange(file);
  };

  return (
    <>
      <div className="col-sm-12 form-section-title">Upload {required}</div>
      <div className="form-group">
        <span className="col-sm-12 text-muted small">{children}</span>
      </div>
      <div className="form-group">
        <div className="col-sm-12">
          <input
            ref={fileRef}
            type="file"
            className={styles.fileInput}
            onChange={changeHandler}
          />
          <button
            onClick={() => fileRef.current.click()}
            type="button"
            className="btn btn-sm btn-primary"
          >
            Select file
          </button>

          <span className="space-left">
            {selectedFile ? (
              selectedFile.name
            ) : (
              <i className="fa fa-times red-icon" aria-hidden="true" />
            )}
          </span>
        </div>
      </div>
    </>
  );
}

export const FileUploadAngular = r2a(FileUpload, [
  'required',
  'onChange',
  'children',
]);
