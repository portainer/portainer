import { Form, useFormikContext } from 'formik';

import { CommonFields } from '@/react/portainer/custom-templates/components/CommonFields';
import { CustomTemplatesVariablesDefinitionField } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { PlatformField } from '@/react/portainer/custom-templates/components/PlatformSelector';
import { GitForm } from '@/react/portainer/gitops/GitForm';
import {
  getTemplateVariables,
  intersectVariables,
  isTemplateVariablesEnabled,
} from '@/react/portainer/custom-templates/components/utils';
import { TemplateTypeSelector } from '@/react/portainer/custom-templates/components/TemplateTypeSelector';

import { BoxSelector } from '@@/BoxSelector';
import { WebEditorForm, usePreventExit } from '@@/WebEditorForm';
import { FileUploadForm } from '@@/form-components/FileUpload';
import { FormActions } from '@@/form-components/FormActions';
import { FormSection } from '@@/form-components/FormSection';
import {
  editor,
  upload,
  git,
} from '@@/BoxSelector/common-options/build-methods';

import { FormValues, Method, buildMethods } from './types';

export function InnerForm({ isLoading }: { isLoading: boolean }) {
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

  usePreventExit(
    initialValues.FileContent,
    values.FileContent,
    values.Method === editor.value && !isSubmitting
  );
  return (
    <Form className="form-horizontal">
      <CommonFields
        values={values}
        onChange={(newValues) =>
          setValues((values) => ({ ...values, ...newValues }))
        }
        errors={errors}
      />

      <PlatformField
        value={values.Platform}
        onChange={(value) => setFieldValue('Platform', value)}
      />

      <TemplateTypeSelector
        value={values.Type}
        onChange={(value) => setFieldValue('Type', value)}
      />

      <FormSection title="Build method">
        <BoxSelector
          slim
          options={buildMethods}
          value={values.Method}
          onChange={handleChangeMethod}
          radioName="buildMethod"
        />
      </FormSection>

      {values.Method === editor.value && (
        <WebEditorForm
          id="custom-template-creation-editor"
          value={values.FileContent}
          onChange={handleChangeFileContent}
          yaml
          placeholder="Define or paste the content of your docker compose file here"
          error={errors.FileContent}
        >
          <p>
            You can get more information about Compose file format in the{' '}
            <a
              href="https://docs.docker.com/compose/compose-file/"
              target="_blank"
              rel="noreferrer"
            >
              official documentation
            </a>
            .
          </p>
        </WebEditorForm>
      )}

      {values.Method === upload.value && (
        <FileUploadForm
          description="You can upload a Compose file from your computer."
          value={values.File}
          onChange={(value) => setFieldValue('File', value)}
          required
        />
      )}

      {values.Method === git.value && (
        <GitForm
          value={values.Git}
          onChange={(newValues) =>
            setFieldValue('Git', { ...values.Git, ...newValues })
          }
          errors={errors.Git}
        />
      )}

      {isTemplateVariablesEnabled && (
        <CustomTemplatesVariablesDefinitionField
          value={values.Variables}
          onChange={(values) => setFieldValue('Variables', values)}
          isVariablesNamesFromParent={values.Method === editor.value}
          errors={errors.Variables}
        />
      )}

      <FormActions
        isLoading={isLoading}
        isValid={isValid}
        loadingText="Creating custom template..."
        submitLabel="Create custom template"
      />
    </Form>
  );

  function handleChangeFileContent(value: string) {
    setFieldValue(
      'FileContent',
      value,
      isTemplateVariablesEnabled ? !value : true
    );
    parseTemplate(value);
  }

  function parseTemplate(value: string) {
    if (!isTemplateVariablesEnabled || value === '') {
      setFieldValue('Variables', []);
      return;
    }

    const [variables, validationError] = getTemplateVariables(value);
    const isValid = !!variables;

    setFieldError(
      'FileContent',
      validationError ? `Template invalid: ${validationError}` : undefined
    );
    if (isValid) {
      setFieldValue(
        'Variables',
        intersectVariables(values.Variables, variables)
      );
    }
  }

  function handleChangeMethod(method: Method) {
    setFieldValue('FileContent', '');
    setFieldValue('Variables', []);
    setFieldValue('Method', method);
  }
}
