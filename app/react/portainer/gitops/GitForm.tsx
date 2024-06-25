import { array, boolean, object, SchemaOf, string } from 'yup';
import { FormikErrors } from 'formik';
import { useState } from 'react';

import { ComposePathField } from '@/react/portainer/gitops/ComposePathField';
import { RefField } from '@/react/portainer/gitops/RefField';
import { GitFormUrlField } from '@/react/portainer/gitops/GitFormUrlField';
import { DeployMethod, GitFormModel } from '@/react/portainer/gitops/types';
import { TimeWindowDisplay } from '@/react/portainer/gitops/TimeWindowDisplay';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { FormSection } from '@@/form-components/FormSection';
import { validateForm } from '@@/form-components/validate-form';
import { SwitchField } from '@@/form-components/SwitchField';

import { GitCredential } from '../account/git-credentials/types';

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
}: Props) {
  const [value, setValue] = useState(initialValue); // TODO: remove this state when form is not inside angularjs

  return (
    <FormSection title="Git repository">
      <AuthFieldset
        value={value}
        onChange={handleChange}
        isAuthExplanationVisible={isAuthExplanationVisible}
        errors={errors}
      />

      <GitFormUrlField
        value={value.RepositoryURL}
        onChange={(value) => handleChange({ RepositoryURL: value })}
        onChangeRepositoryValid={(value) =>
          handleChange({ RepositoryURLValid: value })
        }
        model={value}
        createdFromCustomTemplateId={createdFromCustomTemplateId}
        errors={errors.RepositoryURL}
      />

      <RefField
        value={value.RepositoryReferenceName || ''}
        onChange={(value) => handleChange({ RepositoryReferenceName: value })}
        model={value}
        error={errors.RepositoryReferenceName}
        isUrlValid={value.RepositoryURLValid}
        createdFromCustomTemplateId={createdFromCustomTemplateId}
      />

      <ComposePathField
        value={value.ComposeFilePathInRepository}
        onChange={(value) =>
          handleChange({ ComposeFilePathInRepository: value })
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

      {isBE && value.AutoUpdate && (
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
    </FormSection>
  );

  function handleChange(partialValue: Partial<GitFormModel>) {
    onChange(partialValue);
    setValue((value) => ({ ...value, ...partialValue }));
  }
}

export async function validateGitForm(
  gitCredentials: Array<GitCredential>,
  formValues: GitFormModel,
  isCreatedFromCustomTemplate: boolean,
  deployMethod: DeployMethod = 'compose'
) {
  return validateForm<GitFormModel>(
    () =>
      buildGitValidationSchema(
        gitCredentials,
        isCreatedFromCustomTemplate,
        deployMethod
      ),
    formValues
  );
}

export function buildGitValidationSchema(
  gitCredentials: Array<GitCredential>,
  isCreatedFromCustomTemplate: boolean,
  deployMethod: DeployMethod
): SchemaOf<GitFormModel> {
  return object({
    RepositoryURL: string()
      .test('valid URL', 'The URL must be a valid URL', (value) => {
        if (!value) {
          return true;
        }

        try {
          const url = new URL(value);
          return !!url.hostname;
        } catch {
          return false;
        }
      })
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
  }).concat(
    gitAuthValidation(gitCredentials, false, isCreatedFromCustomTemplate)
  ) as SchemaOf<GitFormModel>;
}
