import { useFormikContext } from 'formik';

import { WebEditorForm } from '@@/WebEditorForm';

import { DeploymentType } from '../../types';

import { FormValues } from './types';

export function NomadForm({
  handleContentChange,
}: {
  handleContentChange: (type: DeploymentType, content: string) => void;
}) {
  const { errors, values } = useFormikContext<FormValues>();

  return (
    <WebEditorForm
      value={values.content}
      yaml
      id="kube-manifest-editor"
      placeholder="Define or paste the content of your manifest here"
      onChange={(value) => handleContentChange(DeploymentType.Nomad, value)}
      error={errors.content}
    >
      <p>
        You can get more information about Nomad file format in the{' '}
        <a
          href="https://www.nomadproject.io/docs/job-specification"
          target="_blank"
          rel="noreferrer"
        >
          official documentation
        </a>
        .
      </p>
    </WebEditorForm>
  );
}
