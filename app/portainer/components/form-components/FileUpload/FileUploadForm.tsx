import { PropsWithChildren, ReactNode } from 'react';

import { r2a } from '@/react-tools/react2angular';
import { FileUploadField } from '@/portainer/components/form-components/FileUpload/FileUploadField';

export interface Props {
  required?: boolean;
  onChange(value: unknown): void;
  children: ReactNode;
  file?: File;
}

export function FileUploadForm({
  required = false,
  onChange,
  children,
  file,
}: PropsWithChildren<Props>) {
  return (
    <>
      <div className="col-sm-12 form-section-title">Upload</div>
      <div className="form-group">
        <span className="col-sm-12 text-muted small">{children}</span>
      </div>
      <div className="form-group">
        <div className="col-sm-12">
          <FileUploadField
            onChange={onChange}
            file={file}
            required={required}
          />
        </div>
      </div>
    </>
  );
}

export const FileUploadFormAngular = r2a(FileUploadForm, [
  'required',
  'onChange',
  'children',
  'file',
]);
