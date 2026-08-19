import { FormikErrors, useFormikContext } from 'formik';
import { SetStateAction, useCallback } from 'react';

import { GitForm } from '@/react/portainer/gitops/GitForm';
import { baseEdgeStackWebhookUrl } from '@/portainer/helpers/webhookHelper';
import { RelativePathFieldset } from '@/react/portainer/gitops/RelativePathFieldset/RelativePathFieldset';
import { applySetStateAction } from '@/react-tools/apply-set-state-action';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

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
import { useRenderCustomTemplate } from './useRenderCustomTemplate';
import { DockerFormValues } from './types';
import { DockerContentField } from './DockerContentField';
import { useRenderAppTemplate } from './useRenderAppTemplate';

const buildMethods = [editor, upload, git, edgeStackTemplate] as const;

interface Props {
  webhookId: string;
  onChangeTemplate: (change: {
    templateType: 'app' | 'custom' | undefined;
    templateId: number | undefined;
  }) => void;
}

export function DockerComposeForm({ webhookId, onChangeTemplate }: Props) {
  const { errors, values, setValues } = useFormikContext<DockerFormValues>();
  const { method } = values;

  const handleChange = useCallback(
    (newValues: Partial<DockerFormValues>) => {
      setValues((values) => ({
        ...values,
        ...newValues,
      }));
    },
    [setValues]
  );

  const saveFileContent = useCallback(
    (value: string) => {
      handleChange({ fileContent: value });
    },
    [handleChange]
  );

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
        <>
          <TemplateFieldset
            values={values.templateValues}
            setValues={(templateAction) => {
              const templateValues = applySetStateAction(
                templateAction,
                values.templateValues
              );
              onChangeTemplate({
                templateId: templateValues.templateId,
                templateType: templateValues.type,
              });
              setValues((values) => ({
                ...values,
                templateValues,
              }));
            }}
            errors={errors?.templateValues}
          />
          {values.templateValues.type === 'app' && (
            <AppTemplateContentField
              values={values}
              handleChange={handleChange}
              errors={errors}
              setValues={setValues}
            />
          )}
          {values.templateValues.type === 'custom' && (
            <CustomTemplateContentField
              values={values}
              handleChange={handleChange}
              errors={errors}
              setValues={setValues}
            />
          )}
        </>
      )}

      {method === editor.value && (
        <DockerContentField
          value={values.fileContent}
          onChange={saveFileContent}
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
            isAutoUpdateVisible={isBE}
          />

          {isBE && (
            <FormSection title="Advanced configurations">
              <RelativePathFieldset
                values={values.relativePath}
                errors={errors.relativePath}
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
          )}
        </>
      )}
    </>
  );
}

type TemplateContentFieldProps = {
  values: DockerFormValues;
  handleChange: (newValues: Partial<DockerFormValues>) => void;
  errors?: FormikErrors<DockerFormValues>;
  setValues: (values: SetStateAction<DockerFormValues>) => void;
};

function AppTemplateContentField({
  values,
  handleChange,
  errors,
  setValues,
}: TemplateContentFieldProps) {
  const { isInitialLoading } = useRenderAppTemplate(
    values.templateValues,
    setValues
  );
  return (
    <DockerContentField
      value={values.fileContent}
      onChange={(value) => handleChange({ fileContent: value })}
      error={errors?.fileContent}
      isLoading={isInitialLoading}
    />
  );
}

function CustomTemplateContentField({
  values,
  handleChange,
  errors,
  setValues,
}: TemplateContentFieldProps) {
  const { customTemplate, isInitialLoading } = useRenderCustomTemplate(
    values.templateValues,
    setValues
  );
  return (
    <DockerContentField
      value={values.fileContent}
      onChange={(value) => handleChange({ fileContent: value })}
      error={errors?.fileContent}
      readonly={!!customTemplate?.GitConfig}
      isLoading={isInitialLoading}
    />
  );
}
