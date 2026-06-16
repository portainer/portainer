import { useState } from 'react';
import { array, boolean, number, object, SchemaOf, string } from 'yup';
import { FormikErrors } from 'formik';

import { ComposePathField } from '@/react/portainer/gitops/ComposePathField';
import { RefField } from '@/react/portainer/gitops/RefField';
import { GitFormUrlField } from '@/react/portainer/gitops/GitFormUrlField';
import { DeployMethod, GitFormModel } from '@/react/portainer/gitops/types';
import { TimeWindowDisplay } from '@/react/portainer/gitops/TimeWindowDisplay';
import { GitSourceSelector } from '@/react/portainer/gitops/sources/GitSourceSelector';

import { FormSection } from '@@/form-components/FormSection';
import { validateForm } from '@@/form-components/validate-form';
import { SwitchField } from '@@/form-components/SwitchField';

import { AdditionalFileField } from './AdditionalFilesField';
import { gitAuthValidation, AuthFieldset } from './AuthFieldset';
import { AutoUpdateFieldset } from './AutoUpdateFieldset';
import { autoUpdateValidation } from './AutoUpdateFieldset/validation';
import { refFieldValidation } from './RefField/RefField';

interface Props {
  value: GitFormModel;
  onChange: (value: Partial<GitFormModel>) => void;
  environmentType?: 'DOCKER' | 'KUBERNETES' | undefined;
  deployMethod?: DeployMethod;
  isDockerStandalone?: boolean;
  isAdditionalFilesFieldVisible?: boolean;
  isForcePullVisible?: boolean;
  isAuthExplanationVisible?: boolean;
  errors?: FormikErrors<GitFormModel>;
  baseWebhookUrl?: string;
  webhookId?: string;
  webhooksDocs?: string;
  createdFromCustomTemplateId?: number;
  isAutoUpdateVisible?: boolean;
  /** When true, shows a SourceSelector instead of the manual git fields. The manual git fields are deprecated and will be removed (BE-13047). */
  isSourceSelectionVisible?: boolean;
}

export function GitForm({
  value: initialValue,
  onChange,
  environmentType = 'DOCKER',
  deployMethod = 'compose',
  isDockerStandalone = false,
  isAdditionalFilesFieldVisible,
  isForcePullVisible,
  isAuthExplanationVisible,
  errors = {},
  baseWebhookUrl,
  webhookId,
  webhooksDocs,
  createdFromCustomTemplateId,
  isAutoUpdateVisible = true,
  isSourceSelectionVisible = false,
}: Props) {
  const [value, setValue] = useState(initialValue); // TODO: remove this state when form is not inside angularjs

  return (
    <FormSection title="Git repository">
      {isSourceSelectionVisible ? (
        <GitSourceSelector
          value={value.SourceId}
          onChange={(source) =>
            handleChange({
              SourceId: source?.id,
              RepositoryURL: source?.url ?? '',
              RepositoryReferenceName: initialValue.RepositoryReferenceName,
              ComposeFilePathInRepository:
                initialValue.ComposeFilePathInRepository,
              RepositoryURLValid: !!source,
            })
          }
          error={errors.SourceId as string | undefined}
        />
      ) : (
        <>
          <AuthFieldset
            value={value}
            onChange={handleChange}
            isAuthExplanationVisible={isAuthExplanationVisible}
            errors={errors}
          />

          <GitFormUrlField
            value={value.RepositoryURL}
            onChange={(value) => {
              handleChange({
                RepositoryURL: value,
                RepositoryReferenceName: initialValue.RepositoryReferenceName,
                ComposeFilePathInRepository:
                  initialValue.ComposeFilePathInRepository,
                RepositoryURLValid: false,
              });
            }}
            onChangeRepositoryValid={(isValid) =>
              handleChange({
                RepositoryURLValid: isValid,
              })
            }
            model={value}
            createdFromCustomTemplateId={createdFromCustomTemplateId}
            errors={errors.RepositoryURL}
          />

          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                label="Skip TLS Verification"
                data-cy="gitops-skip-tls-verification-switch"
                checked={value.TLSSkipVerify || false}
                onChange={(value) => handleChange({ TLSSkipVerify: value })}
                name="TLSSkipVerify"
                tooltip="Enabling this will allow skipping TLS validation for any self-signed certificate."
                labelClass="col-sm-3 col-lg-2"
              />
            </div>
          </div>
        </>
      )}

      <RefField
        value={value.RepositoryReferenceName || ''}
        onChange={(value) => handleChange({ RepositoryReferenceName: value })}
        model={value}
        error={errors.RepositoryReferenceName}
        isUrlValid={value.RepositoryURLValid}
        createdFromCustomTemplateId={createdFromCustomTemplateId}
      />

      <ComposePathField
        value={value.ComposeFilePathInRepository || ''}
        onChange={(value) =>
          handleChange({ ComposeFilePathInRepository: value || undefined })
        }
        isCompose={deployMethod === 'compose'}
        model={value}
        isDockerStandalone={isDockerStandalone}
        errors={errors.ComposeFilePathInRepository}
        createdFromCustomTemplateId={createdFromCustomTemplateId}
      />

      {isAdditionalFilesFieldVisible && (
        <AdditionalFileField
          value={value.AdditionalFiles || []}
          onChange={(value) => handleChange({ AdditionalFiles: value })}
          errors={errors.AdditionalFiles}
        />
      )}

      {isAutoUpdateVisible && value.AutoUpdate && (
        <AutoUpdateFieldset
          environmentType={environmentType}
          webhookId={webhookId || ''}
          baseWebhookUrl={baseWebhookUrl || ''}
          value={value.AutoUpdate}
          onChange={(value) => handleChange({ AutoUpdate: value })}
          isForcePullVisible={isForcePullVisible}
          errors={errors.AutoUpdate as FormikErrors<GitFormModel['AutoUpdate']>}
          webhooksDocs={webhooksDocs}
        />
      )}

      <TimeWindowDisplay />
    </FormSection>
  );

  function handleChange(partialValue: Partial<GitFormModel>) {
    onChange(partialValue);
    setValue((value) => ({ ...value, ...partialValue }));
  }
}

export async function validateGitForm(
  formValues: GitFormModel,
  isCreatedFromCustomTemplate: boolean,
  deployMethod: DeployMethod = 'compose',
  isSourceSelection = false
) {
  return validateForm<GitFormModel>(
    () =>
      buildGitValidationSchema(
        isCreatedFromCustomTemplate,
        deployMethod,
        false,
        isSourceSelection
      ),
    formValues
  );
}

export function buildGitValidationSchema(
  isCreatedFromCustomTemplate: boolean,
  deployMethod: DeployMethod,
  isEdit = false,
  isSourceSelection = false
): SchemaOf<GitFormModel> {
  return object({
    // In source-selection mode the repository URL is derived from the selected
    // source (not user-editable), so the user provides a SourceId instead and
    // the URL itself needs no validation.
    RepositoryURL: isSourceSelection
      ? string()
      : string()
          .test('valid URL', 'The URL must be a valid URL', isValidGitUrl)
          .required('Repository URL is required'),
    RepositoryReferenceName: refFieldValidation(),
    ComposeFilePathInRepository: string().required(
      deployMethod === 'compose'
        ? 'Compose file path is required'
        : 'Manifest file path is required'
    ),
    AdditionalFiles: array(string().required('Path is required')).default([]),
    RepositoryURLValid: boolean().default(false),
    AutoUpdate: autoUpdateValidation().nullable(),
    TLSSkipVerify: boolean().default(false),
    SourceId: isSourceSelection
      ? number().min(1, 'Source is required').required('Source is required')
      : number().optional().nullable(),
  }).concat(
    gitAuthValidation(isEdit, isCreatedFromCustomTemplate)
  ) as SchemaOf<GitFormModel>;
}

function isValidGitUrl(value?: string) {
  if (!value) {
    return true;
  }

  try {
    return !!new URL(value).hostname;
  } catch {
    return false;
  }
}
