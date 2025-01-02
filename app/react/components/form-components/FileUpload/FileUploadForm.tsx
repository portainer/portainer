import { PropsWithChildren, ReactNode } from 'react';

import { AutomationTestingProps } from '@/types';

import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { FileUploadField } from '@@/form-components/FileUpload/FileUploadField';

export interface Props {
  onChange(value?: File): void;
  value: File | undefined;
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
  'data-cy': dataCy,
}: PropsWithChildren<Props> & AutomationTestingProps) {
  return (
    <div className="file-upload-form">
      <FormSectionTitle>Upload</FormSectionTitle>
      <div className="form-group">
        <span className="col-sm-12 text-muted small">{description}</span>
      </div>
      <div className="form-group">
        <div className="col-sm-12">
          <FileUploadField
            inputId="file-upload-field"
            data-cy={dataCy}
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
