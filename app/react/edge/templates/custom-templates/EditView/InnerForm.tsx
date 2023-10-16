import { Form, useFormikContext } from 'formik';
import { RefreshCw } from 'lucide-react';

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

import { WebEditorForm, usePreventExit } from '@@/WebEditorForm';
import { FormActions } from '@@/form-components/FormActions';
import { Button } from '@@/buttons';
import { FormError } from '@@/form-components/FormError';

import { FormValues } from './types';

export function InnerForm({
  isLoading,
  isEditorReadonly,
  gitFileContent,
  gitFileError,
  refreshGitFile,
}: {
  isLoading: boolean;
  isEditorReadonly: boolean;
  gitFileContent?: string;
  gitFileError?: string;
  refreshGitFile: () => void;
}) {
  const {
    values,
    initialValues,
    setFieldValue,
    errors,
    isValid,
    setFieldError,
    isSubmitting,
    dirty,
    setValues,
  } = useFormikContext<FormValues>();

  usePreventExit(
    initialValues.FileContent,
    values.FileContent,
    !isEditorReadonly && !isSubmitting
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

      <WebEditorForm
        id="edit-custom-template-editor"
        value={gitFileContent || values.FileContent}
        onChange={handleChangeFileContent}
        yaml
        placeholder="Define or paste the content of your docker compose file here"
        error={errors.FileContent}
        readonly={isEditorReadonly}
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

      {values.Git && (
        <>
          <GitForm
            value={values.Git}
            onChange={(newValues) =>
              setFieldValue('Git', { ...values.Git, ...newValues })
            }
            errors={typeof errors.Git === 'object' ? errors.Git : undefined}
          />
          <div className="form-group">
            <div className="col-sm-12">
              <Button color="light" icon={RefreshCw} onClick={refreshGitFile}>
                Reload custom template
              </Button>
            </div>
            {gitFileError && (
              <div className="col-sm-12">
                <FormError>
                  Custom template could not be loaded, {gitFileError}.
                </FormError>
              </div>
            )}
          </div>
        </>
      )}

      {isTemplateVariablesEnabled && (
        <CustomTemplatesVariablesDefinitionField
          value={values.Variables}
          onChange={(values) => setFieldValue('Variables', values)}
          isVariablesNamesFromParent={!isEditorReadonly}
          errors={errors.Variables}
        />
      )}

      <FormActions
        isLoading={isLoading}
        isValid={isValid && dirty}
        loadingText="Updating custom template..."
        submitLabel="Update custom template"
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

    setFieldError(
      'FileContent',
      validationError ? `Template invalid: ${validationError}` : undefined
    );
    if (variables) {
      setFieldValue(
        'Variables',
        intersectVariables(values.Variables, variables)
      );
    }
  }
}
