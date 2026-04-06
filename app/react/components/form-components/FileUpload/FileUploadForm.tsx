import { PropsWithChildren, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { AutomationTestingProps } from '@/types';

import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { FileUploadField } from '@@/form-components/FileUpload/FileUploadField';

import { FormError } from '../FormError';

export interface Props {
  onChange(value?: File): void;
  value: File | undefined;
  title?: string;
  required?: boolean;
  description: ReactNode;
  error?: string;
}

export function FileUploadForm({
  onChange,
  value,
  title,
  required = false,
  description,
  error,
  'data-cy': dataCy,
}: PropsWithChildren<Props> & AutomationTestingProps) {
  const { t } = useTranslation();
  const resolvedTitle = title || t('common.fileUpload.select_a_file');
  return (
    <div className="file-upload-form">
      <FormSectionTitle htmlFor="file-upload-field">{t('common.fileUpload.upload')}</FormSectionTitle>
      <div className="form-group">
        <span className="col-sm-12 text-muted small">{description}</span>
        {error && (
          <div className="col-sm-12">
            <FormError>{error}</FormError>
          </div>
        )}
      </div>
      <div className="form-group">
        <div className="col-sm-12">
          <FileUploadField
            inputId="file-upload-field"
            data-cy={dataCy}
            onChange={onChange}
            value={value}
            title={resolvedTitle}
            required={required}
          />
        </div>
      </div>
    </div>
  );
}
