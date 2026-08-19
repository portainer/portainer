import { useFormikContext } from 'formik';

import { textByType } from '@/react/common/stacks/common/form-texts';
import { StackType } from '@/react/common/stacks/types';

import { FileUploadForm } from '@@/form-components/FileUpload';

import { FormValues } from '../types';

export function UploadSection({ isSwarm }: { isSwarm: boolean }) {
  const texts =
    textByType[isSwarm ? StackType.DockerSwarm : StackType.DockerCompose];
  const { values, errors, setFieldValue } = useFormikContext<FormValues>();

  return (
    <FileUploadForm
      value={values.upload.file || undefined}
      onChange={(file) => setFieldValue('upload.file', file)}
      required
      description={texts.upload}
      data-cy="stack-creation-file-upload"
      error={errors.upload?.file}
    />
  );
}
