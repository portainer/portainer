import { SetStateAction } from 'react';
import { FormikErrors } from 'formik';

import { GitForm } from '@/react/portainer/gitops/GitForm';
import { GitFormModel } from '@/react/portainer/gitops/types';
import { baseEdgeStackWebhookUrl } from '@/portainer/helpers/webhookHelper';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { BoxSelector } from '@@/BoxSelector';
import { WebEditorForm } from '@@/WebEditorForm';
import { FileUploadForm } from '@@/form-components/FileUpload';
import { SwitchField } from '@@/form-components/SwitchField';
import { FormSection } from '@@/form-components/FormSection';
import {
  editor,
  git,
  upload,
} from '@@/BoxSelector/common-options/build-methods';

const buildMethods = [editor, upload, git] as const;

export interface KubeFormValues {
  method: 'editor' | 'upload' | 'repository' | 'template';
  useManifestNamespaces: boolean;
  fileContent: string;
  file?: File;
  git: GitFormModel;
}

export function KubeManifestForm({
  errors,
  values,
  setValues,
  webhookId,
}: {
  errors?: FormikErrors<KubeFormValues>;
  values: KubeFormValues;
  setValues: (values: SetStateAction<KubeFormValues>) => void;
  webhookId: string;
}) {
  const { method } = values;

  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="Use namespace(s) specified from manifest"
            tooltip="If you have defined namespaces in your deployment file turning this on will enforce the use of those only in the deployment"
            checked={values.useManifestNamespaces}
            onChange={(value) =>
              handleChange({
                useManifestNamespaces: value,
              })
            }
            data-cy="use-manifest-namespaces-switch"
          />
        </div>
      </div>

      <FormSection title="Build Method">
        <BoxSelector
          options={buildMethods}
          onChange={(value) => handleChange({ method: value })}
          value={method}
          radioName="method"
          slim
        />
      </FormSection>

      {method === editor.value && (
        <WebEditorForm
          id="stack-creation-editor"
          value={values.fileContent}
          onChange={(value) => handleChange({ fileContent: value })}
          type="yaml"
          textTip="Define or paste the content of your manifest file here"
          error={errors?.fileContent}
          data-cy="stack-creation-editor"
        >
          <KubeDeployDescription />
        </WebEditorForm>
      )}

      {method === upload.value && (
        <FileUploadForm
          value={values.file}
          onChange={(file) => handleChange({ file })}
          required
          description="You can upload a Manifest file from your computer."
          data-cy="stack-creation-file-upload"
        >
          <KubeDeployDescription />
        </FileUploadForm>
      )}

      {method === git.value && (
        <GitForm
          deployMethod="manifest"
          errors={errors?.git}
          value={values.git}
          onChange={(gitValues) =>
            setValues((values) => ({
              ...values,
              git: {
                ...values.git,
                ...gitValues,
              },
            }))
          }
          baseWebhookUrl={baseEdgeStackWebhookUrl()}
          webhookId={webhookId}
          isAutoUpdateVisible={isBE}
        />
      )}
    </>
  );

  function handleChange(newValues: Partial<KubeFormValues>) {
    setValues((values) => ({
      ...values,
      ...newValues,
    }));
  }
}

function KubeDeployDescription() {
  return (
    <>
      <div>
        Templates allow deploying any kind of Kubernetes resource (Deployment,
        Secret, ConfigMap...)
      </div>
      <div>
        You can get more information about Kubernetes file format in the
        <a
          href="https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/"
          target="_blank"
          rel="noreferrer"
        >
          official documentation
        </a>
        .
      </div>
    </>
  );
}
