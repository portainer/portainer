import { Field, Form, useFormikContext } from 'formik';
import { Copy, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EnvironmentId } from '@/react/portainer/environments/types';

import { LoadingButton } from '@@/buttons/LoadingButton';
import { Input } from '@@/form-components/Input';
import { FormError } from '@@/form-components/FormError';
import { TextTip } from '@@/Tip/TextTip';

import { FormSubmitValues, ActionType } from './StackDuplicationForm.types';
import { useValidation } from './StackDuplicationForm.validation';
import { EnvSelector } from './EnvSelector';

interface Props {
  yamlError?: string;
  currentEnvironmentId: EnvironmentId;
  currentStackName: string;
  isLoading: boolean;
}

export function StackDuplicationFormInner({
  yamlError,
  currentEnvironmentId,
  currentStackName,
  isLoading,
}: Props) {
  const { values, errors, setFieldValue, submitForm } =
    useFormikContext<FormSubmitValues>();
  const { t } = useTranslation();

  const validState = useValidation({
    values,
    currentStackName,
    currentEnvironmentId,
  });

  const isEnvSelected = !!values.environmentId;

  async function handleAction(type: ActionType) {
    // Set the actionType in form values before submitting
    await setFieldValue('actionType', type);
    await submitForm();
  }

  const isMigrateInProgress = isLoading && values.actionType === 'migrate';
  const isDuplicateInProgress = isLoading && values.actionType === 'duplicate';

  const isMigrateDisabled = isLoading || !validState.migrate;
  const isDuplicateDisabled = isLoading || !validState.duplicate || !!yamlError;

  return (
    <Form>
      <TextTip color="blue">
        <p>{t('docker.stacks.duplication.tip')} </p>
        <p>{t('docker.stacks.duplication.renameTip')}</p>
      </TextTip>

      <div className="form-group">
        <Field
          as={Input}
          type="text"
          placeholder={t('docker.stacks.duplication.namePlaceholder')}
          aria-label={t('docker.stacks.duplication.nameLabel')}
          name="newName"
          data-cy="stack-duplicate-name-input"
        />
        {errors.newName && (
          <div className="col-sm-12">
            <FormError>{errors.newName}</FormError>
          </div>
        )}
      </div>

      <EnvSelector
        onChange={(value) => setFieldValue('environmentId', value)}
        value={values.environmentId}
        error={errors.environmentId}
      />

      <div className="inline-flex gap-2">
        <LoadingButton
          type="button"
          color="primary"
          size="small"
          disabled={isMigrateDisabled}
          isLoading={isMigrateInProgress}
          loadingText={
            values.environmentId === currentEnvironmentId
              ? t('docker.stacks.duplication.renamingInProgress')
              : t('docker.stacks.duplication.migrationInProgress')
          }
          onClick={() => handleAction('migrate')}
          icon={ArrowRight}
          data-cy="stack-migrate-button"
          className="!ml-0"
        >
          {values.environmentId === currentEnvironmentId ? t('docker.stacks.duplication.renameButton') : t('docker.stacks.duplication.migrateButton')}
        </LoadingButton>

        <LoadingButton
          type="button"
          color="primary"
          size="small"
          disabled={isDuplicateDisabled}
          isLoading={isDuplicateInProgress}
          loadingText={t('docker.stacks.duplication.duplicationInProgress')}
          onClick={() => handleAction('duplicate')}
          icon={Copy}
          data-cy="stack-duplicate-button"
        >
          {t('docker.stacks.duplication.duplicateButton')}
        </LoadingButton>
      </div>

      {yamlError && isEnvSelected && (
        <div className="form-group" role="alert" aria-label="Yaml Error">
          <div>
            <span className="text-danger small">{yamlError}</span>
          </div>
        </div>
      )}
    </Form>
  );
}
