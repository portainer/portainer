import { Field, Form, useFormikContext } from 'formik';
import { Copy, ArrowRight } from 'lucide-react';

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
        <p>This feature allows you to duplicate or migrate this stack. </p>
        <p>To rename the stack, choose the same environment when migrating.</p>
      </TextTip>

      <div className="form-group">
        <Field
          as={Input}
          type="text"
          placeholder="Stack name (optional for migration)"
          aria-label="Stack name"
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
              ? 'Renaming in progress...'
              : 'Migration in progress...'
          }
          onClick={() => handleAction('migrate')}
          icon={ArrowRight}
          data-cy="stack-migrate-button"
          className="!ml-0"
        >
          {values.environmentId === currentEnvironmentId ? 'Rename' : 'Migrate'}
        </LoadingButton>

        <LoadingButton
          type="button"
          color="primary"
          size="small"
          disabled={isDuplicateDisabled}
          isLoading={isDuplicateInProgress}
          loadingText="Duplication in progress..."
          onClick={() => handleAction('duplicate')}
          icon={Copy}
          data-cy="stack-duplicate-button"
        >
          Duplicate
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
