import { Form, FormikErrors, useFormikContext } from 'formik';

import { CommonFields } from '@/react/portainer/custom-templates/components/CommonFields';
import { CustomTemplatesVariablesDefinitionField } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { PlatformField } from '@/react/portainer/custom-templates/components/PlatformSelector';
import { GitForm } from '@/react/portainer/gitops/GitForm';
import { isTemplateVariablesEnabled } from '@/react/portainer/custom-templates/components/utils';
import { TemplateTypeSelector } from '@/react/portainer/custom-templates/components/TemplateTypeSelector';
import { AccessControlForm } from '@/react/portainer/access-control';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { applySetStateAction } from '@/react-tools/apply-set-state-action';
import { AccessControlFormData } from '@/react/portainer/access-control/types';
import { textByType } from '@/react/common/stacks/common/form-texts';
import { StackType } from '@/react/common/stacks/types';

import { BoxSelector } from '@@/BoxSelector';
import { WebEditorForm, usePreventExit } from '@@/WebEditorForm';
import { FileUploadForm } from '@@/form-components/FileUpload';
import { FormActions } from '@@/form-components/FormActions';
import { FormSection } from '@@/form-components/FormSection';

import { EdgeTemplateSettings } from '../types';
import { useParseTemplateOnFileChange } from '../useParseTemplateOnFileChange';

import { EdgeSettingsFieldset } from './EdgeSettingsFieldset';
import { FormValues, Method, initialBuildMethods } from './types';

export function InnerForm({
  isLoading,
  environmentId,
  buildMethods,
}: {
  isLoading: boolean;
  environmentId?: EnvironmentId;
  buildMethods: Array<(typeof initialBuildMethods)[number]>;
}) {
  const {
    values,
    initialValues,
    setFieldValue,
    errors,
    isValid,
    setFieldError,
    setValues,
    isSubmitting,
  } = useFormikContext<FormValues>();

  const isGit = values.Method === 'repository';
  const isEditor = values.Method === 'editor';

  usePreventExit(
    initialValues.FileContent,
    values.FileContent,
    isEditor && !isSubmitting && !isLoading
  );

  const handleChangeFileContent = useParseTemplateOnFileChange(
    values.Variables
  );

  const texts = textByType[values.Type];

  return (
    <Form className="form-horizontal">
      <CommonFields
        values={values}
        onChange={(newValues) =>
          setValues((values) => ({ ...values, ...newValues }))
        }
        errors={errors}
      />

      {values.Type !== StackType.Kubernetes && (
        <>
          <PlatformField
            value={values.Platform}
            onChange={(value) => setFieldValue('Platform', value)}
          />

          <TemplateTypeSelector
            value={values.Type}
            onChange={(value) => setFieldValue('Type', value)}
          />
        </>
      )}

      <FormSection title="Build method">
        <BoxSelector
          slim
          options={buildMethods}
          value={values.Method}
          onChange={handleChangeMethod}
          radioName="buildMethod"
        />
      </FormSection>

      {isEditor && (
        <WebEditorForm
          data-cy="custom-template-creation-editor"
          id="custom-template-creation-editor"
          value={values.FileContent}
          onChange={handleChangeFileContent}
          type="yaml"
          textTip={texts.editor.placeholder}
          error={errors.FileContent}
        >
          {texts.editor.description}
        </WebEditorForm>
      )}

      {values.Method === 'upload' && (
        <FileUploadForm
          description={texts.upload}
          value={values.File}
          onChange={(value) => setFieldValue('File', value)}
          required
          data-cy="custom-template-creation-file-upload"
        />
      )}

      {isGit && (
        <GitForm
          deployMethod={
            values.Type === StackType.Kubernetes ? 'manifest' : 'compose'
          }
          value={values.Git}
          onChange={(newValues) =>
            setValues((values) => ({
              ...values,
              Git: { ...values.Git, ...newValues },
            }))
          }
          errors={errors.Git}
        />
      )}

      {isTemplateVariablesEnabled && (
        <CustomTemplatesVariablesDefinitionField
          value={values.Variables}
          onChange={(values) => setFieldValue('Variables', values)}
          isVariablesNamesFromParent={isEditor}
          errors={errors.Variables}
        />
      )}

      {!!values.AccessControl && (
        <AccessControlForm
          environmentId={environmentId || 0}
          onChange={(values) => setFieldValue('AccessControl', values)}
          values={values.AccessControl}
          errors={errors.AccessControl as FormikErrors<AccessControlFormData>}
          formNamespace="accessControl"
        />
      )}

      {values.EdgeSettings && (
        <EdgeSettingsFieldset
          setValues={(edgeSetValues) =>
            setValues((values) => ({
              ...values,
              EdgeSettings: applySetStateAction(
                edgeSetValues,
                values.EdgeSettings!
              ),
            }))
          }
          gitConfig={isGit ? values.Git : undefined}
          fileValues={{
            fileContent: values.FileContent,
            file: values.File,
          }}
          values={values.EdgeSettings}
          errors={errors.EdgeSettings as FormikErrors<EdgeTemplateSettings>}
          setFieldError={setFieldError}
        />
      )}

      <FormActions
        isLoading={isLoading}
        isValid={isValid}
        loadingText="Creating custom template..."
        submitLabel="Create custom template"
        data-cy="custom-template-creation-submit-button"
      />
    </Form>
  );

  function handleChangeMethod(method: Method) {
    setFieldValue('FileContent', '');
    setFieldValue('Variables', []);
    setFieldValue('Method', method);
  }
}
