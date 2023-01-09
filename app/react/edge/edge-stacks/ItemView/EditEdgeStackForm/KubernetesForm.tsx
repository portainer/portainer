import { useFormikContext } from 'formik';

import { SwitchField } from '@@/form-components/SwitchField';
import { WebEditorForm } from '@@/WebEditorForm';

import { DeploymentType } from '../../types';

import { FormValues } from './types';

export function KubernetesForm({
  handleContentChange,
}: {
  handleContentChange: (type: DeploymentType, content: string) => void;
}) {
  const { errors, values, setFieldValue } = useFormikContext<FormValues>();

  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="Use namespace(s) specified from manifest"
            tooltip="If you have defined namespaces in your deployment file turning this on will enforce the use of those only in the deployment"
            checked={values.useManifestNamespaces}
            onChange={(value) => setFieldValue('useManifestNamespaces', value)}
          />
        </div>
      </div>

      <WebEditorForm
        value={values.content}
        yaml
        id="kube-manifest-editor"
        placeholder="Define or paste the content of your manifest here"
        onChange={(value) =>
          handleContentChange(DeploymentType.Kubernetes, value)
        }
        error={errors.content}
      >
        <p>
          You can get more information about Kubernetes file format in the{' '}
          <a
            href="https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/"
            target="_blank"
            rel="noreferrer"
          >
            official documentation
          </a>
          .
        </p>
      </WebEditorForm>
    </>
  );
}
