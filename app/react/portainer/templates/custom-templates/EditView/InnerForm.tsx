import { Form, FormikErrors, useFormikContext } from 'formik';
import { RefreshCw } from 'lucide-react';

import { CommonFields } from '@/react/portainer/custom-templates/components/CommonFields';
import { CustomTemplatesVariablesDefinitionField } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { PlatformField } from '@/react/portainer/custom-templates/components/PlatformSelector';
import { GitForm } from '@/react/portainer/gitops/GitForm';
import { isTemplateVariablesEnabled } from '@/react/portainer/custom-templates/components/utils';
import { TemplateTypeSelector } from '@/react/portainer/custom-templates/components/TemplateTypeSelector';
import { applySetStateAction } from '@/react-tools/apply-set-state-action';
import { EdgeTemplateSettings } from '@/react/portainer/templates/custom-templates/types';
import { EdgeSettingsFieldset } from '@/react/portainer/templates/custom-templates/CreateView/EdgeSettingsFieldset';
import { StackType } from '@/react/common/stacks/types';
import { textByType } from '@/react/common/stacks/common/form-texts';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { AccessControlForm } from '@/react/portainer/access-control';
import { AccessControlFormData } from '@/react/portainer/access-control/types';

import { WebEditorForm, usePreventExit } from '@@/WebEditorForm';
import { FormActions } from '@@/form-components/FormActions';
import { Button } from '@@/buttons';
import { FormError } from '@@/form-components/FormError';

import { useParseTemplateOnFileChange } from '../useParseTemplateOnFileChange';

import { FormValues } from './types';

export function InnerForm({
  isLoading,
  environmentId,
  isEditorReadonly,
  gitFileContent,
  gitFileError,
  refreshGitFile,
}: {
  isLoading: boolean;
  environmentId?: EnvironmentId;
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
    setValues,
    isSubmitting,
    dirty,
  } = useFormikContext<FormValues>();
  usePreventExit(
    initialValues.FileContent,
    values.FileContent,
    !isEditorReadonly && !isSubmitting && !isLoading
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

      <WebEditorForm
        data-cy="custom-template-editor"
        id="edit-custom-template-editor"
        value={gitFileContent || values.FileContent}
        onChange={handleChangeFileContent}
        type="yaml"
        textTip={
          gitFileContent
            ? 'Preview of the file from git repository'
            : texts.editor.placeholder
        }
        error={errors.FileContent}
        readonly={isEditorReadonly}
      >
        {texts.editor.description}
      </WebEditorForm>

      {values.Git && (
        <>
          <GitForm
            value={values.Git}
            onChange={(newValues) =>
              setValues((values) => ({
                ...values,
                // set ! for values.Git because this callback will only be called when it's defined (see L94)
                Git: { ...values.Git!, ...newValues },
              }))
            }
            deployMethod={
              values.Type === StackType.Kubernetes ? 'manifest' : 'compose'
            }
            errors={typeof errors.Git === 'object' ? errors.Git : undefined}
          />
          <div className="form-group">
            <div className="col-sm-12">
              <Button
                color="light"
                icon={RefreshCw}
                onClick={refreshGitFile}
                data-cy="custom-template-edit-reload-git-file-button"
              >
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
          setValues={(edgeValues) =>
            setFieldValue(
              'EdgeSettings',
              applySetStateAction(edgeValues, values.EdgeSettings!)
            )
          }
          gitConfig={values.Git}
          fileValues={{
            fileContent: values.FileContent,
          }}
          values={values.EdgeSettings}
          errors={errors.EdgeSettings as FormikErrors<EdgeTemplateSettings>}
          setFieldError={setFieldError}
        />
      )}

      <FormActions
        isLoading={isLoading}
        isValid={isValid && dirty}
        loadingText="Updating custom template..."
        submitLabel="Update custom template"
        data-cy="custom-template-edit-submit-button"
      />
    </Form>
  );
}
