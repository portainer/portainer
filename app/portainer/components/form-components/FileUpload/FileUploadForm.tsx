import { PropsWithChildren, ReactNode } from 'react';

import { FormSectionTitle } from '@/portainer/components/form-components/FormSectionTitle';
import { FileUploadField } from '@/portainer/components/form-components/FileUpload/FileUploadField';

export interface Props {
  onChange(value: unknown): void;
  value?: File;
  title?: string;
  required?: boolean;
  description: ReactNode;
}

export function FileUploadForm({
  onChange,
  value,
  title = 'Select a file',
  required = false,
  description,
}: PropsWithChildren<Props>) {
  return (
    <div className="file-upload-form">
      <FormSectionTitle>Upload</FormSectionTitle>
      <div className="form-group">
        <span className="col-sm-12 text-muted small">{description}</span>
      </div>
      <div className="form-group">
        <div className="col-sm-12">
          <FileUploadField
            onChange={onChange}
            value={value}
            title={title}
            required={required}
          />
        </div>
      </div>
    </div>
  );
}
