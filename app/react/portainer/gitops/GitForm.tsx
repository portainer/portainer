import { array, boolean, object, SchemaOf, string } from 'yup';
import { FormikErrors } from 'formik';

import { ComposePathField } from '@/react/portainer/gitops/ComposePathField';
import { RefField } from '@/react/portainer/gitops/RefField';
import { GitFormUrlField } from '@/react/portainer/gitops/GitFormUrlField';
import { GitFormModel } from '@/react/portainer/gitops/types';
import { TimeWindowDisplay } from '@/react/portainer/gitops/TimeWindowDisplay';

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
  deployMethod?: 'compose' | 'nomad' | 'manifest';
  isDockerStandalone?: boolean;
  isAdditionalFilesFieldVisible?: boolean;
  isForcePullVisible?: boolean;
  isAuthExplanationVisible?: boolean;
  errors: FormikErrors<GitFormModel>;
  baseWebhookUrl: string;
  webhookId: string;
  webhooksDocs?: string;
}

export function GitForm({
  value,
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
}: Props) {
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
        errors={errors.RepositoryURL}
      />

      <RefField
        value={value.RepositoryReferenceName || ''}
        onChange={(value) => handleChange({ RepositoryReferenceName: value })}
        model={value}
        error={errors.RepositoryReferenceName}
        isUrlValid={value.RepositoryURLValid}
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
      />

      {isAdditionalFilesFieldVisible && (
        <AdditionalFileField
          value={value.AdditionalFiles}
          onChange={(value) => handleChange({ AdditionalFiles: value })}
          errors={errors.AdditionalFiles}
        />
      )}

      {value.AutoUpdate && (
        <AutoUpdateFieldset
          environmentType={environmentType}
          webhookId={webhookId}
          baseWebhookUrl={baseWebhookUrl}
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
            checked={value.TLSSkipVerify}
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
  }
}

export async function validateGitForm(
  gitCredentials: Array<GitCredential>,
  formValues: GitFormModel
) {
  return validateForm<GitFormModel>(
    () => buildGitValidationSchema(gitCredentials),
    formValues
  );
}

export function buildGitValidationSchema(
  gitCredentials: Array<GitCredential>
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
      'Compose file path is required'
    ),
    AdditionalFiles: array(string().required('Path is required')).default([]),
    RepositoryURLValid: boolean().default(false),
    AutoUpdate: autoUpdateValidation().nullable(),
    TLSSkipVerify: boolean().default(false),
  }).concat(gitAuthValidation(gitCredentials, false));
}
