import { array, boolean, object, SchemaOf, string } from 'yup';
import { FormikErrors } from 'formik';

import { ComposePathField } from '@/react/portainer/gitops/ComposePathField';
import { RefField } from '@/react/portainer/gitops/RefField';
import { GitFormUrlField } from '@/react/portainer/gitops/GitFormUrlField';
import { GitFormModel } from '@/react/portainer/gitops/types';
import { TimeWindowDisplay } from '@/react/portainer/gitops/TimeWindowDisplay';

import { FormSection } from '@@/form-components/FormSection';
import { validateForm } from '@@/form-components/validate-form';

import { GitCredential } from '../account/git-credentials/types';

import { AdditionalFileField } from './AdditionalFilesField';
import { gitAuthValidation, AuthFieldset } from './AuthFieldset';
import { AutoUpdateFieldset } from './AutoUpdateFieldset';
import { autoUpdateValidation } from './AutoUpdateFieldset/validation';
import { refFieldValidation } from './RefField/RefField';

interface Props {
  value: GitFormModel;
  onChange: (value: Partial<GitFormModel>) => void;
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
        isExplanationVisible={isAuthExplanationVisible}
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
      .url('Invalid Url')
      .required('Repository URL is required'),
    RepositoryReferenceName: refFieldValidation(),
    ComposeFilePathInRepository: string().required(
      'Compose file path is required'
    ),
    AdditionalFiles: array(string().required()).default([]),
    RepositoryURLValid: boolean().default(false),
    AutoUpdate: autoUpdateValidation().nullable(),
  }).concat(gitAuthValidation(gitCredentials));
}
