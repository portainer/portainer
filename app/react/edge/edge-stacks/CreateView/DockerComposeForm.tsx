import { useFormikContext } from 'formik';

import { GitForm } from '@/react/portainer/gitops/GitForm';
import { baseEdgeStackWebhookUrl } from '@/portainer/helpers/webhookHelper';
import { RelativePathFieldset } from '@/react/portainer/gitops/RelativePathFieldset/RelativePathFieldset';
import { applySetStateAction } from '@/react-tools/apply-set-state-action';

import { BoxSelector } from '@@/BoxSelector';
import { FormSection } from '@@/form-components/FormSection';
import {
  editor,
  git,
  edgeStackTemplate,
  upload,
} from '@@/BoxSelector/common-options/build-methods';
import { FileUploadForm } from '@@/form-components/FileUpload';

import { TemplateFieldset } from './TemplateFieldset/TemplateFieldset';
import { useRenderTemplate } from './useRenderTemplate';
import { DockerFormValues } from './types';
import { DockerContentField } from './DockerContentField';

const buildMethods = [editor, upload, git, edgeStackTemplate] as const;

export function DockerComposeForm({
  webhookId,
  onChangeTemplate,
}: {
  webhookId: string;
  onChangeTemplate: ({
    type,
    id,
  }: {
    type: 'app' | 'custom' | undefined;
    id: number | undefined;
  }) => void;
}) {
  const { errors, values, setValues } = useFormikContext<DockerFormValues>();
  const { method } = values;

  const template = useRenderTemplate(values.templateValues, setValues);

  return (
    <>
      <FormSection title="Build Method">
        <BoxSelector
          options={buildMethods}
          onChange={(value) => handleChange({ method: value })}
          value={method}
          radioName="method"
          slim
        />
      </FormSection>

      {method === edgeStackTemplate.value && (
        <TemplateFieldset
          values={values.templateValues}
          setValues={(templateAction) =>
            setValues((values) => {
              const templateValues = applySetStateAction(
                templateAction,
                values.templateValues
              );
              onChangeTemplate({
                id: templateValues.templateId,
                type: templateValues.type,
              });

              return {
                ...values,
                templateValues,
              };
            })
          }
          errors={errors?.templateValues}
        />
      )}

      {(method === editor.value ||
        (method === edgeStackTemplate.value && template)) && (
        <DockerContentField
          value={values.fileContent}
          onChange={(value) => handleChange({ fileContent: value })}
          readonly={method === edgeStackTemplate.value && !!template?.GitConfig}
          error={errors?.fileContent}
        />
      )}

      {method === upload.value && (
        <FileUploadForm
          value={values.file}
          onChange={(File) => handleChange({ file: File })}
          required
          description="You can upload a Compose file from your computer."
          data-cy="stack-creation-file-upload"
        />
      )}

      {method === git.value && (
        <>
          <GitForm
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
          />

          <FormSection title="Advanced configurations">
            <RelativePathFieldset
              values={values.relativePath}
              gitModel={values.git}
              onChange={(relativePath) =>
                setValues((values) => ({
                  ...values,
                  relativePath: {
                    ...values.relativePath,
                    ...relativePath,
                  },
                }))
              }
            />
          </FormSection>
        </>
      )}
    </>
  );

  function handleChange(newValues: Partial<DockerFormValues>) {
    setValues((values) => ({
      ...values,
      ...newValues,
    }));
  }
}
