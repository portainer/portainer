import { Field, Form, useFormikContext } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { LoadingButton } from '@@/buttons';

import { ApiKeyFormValues } from './types';

interface Props {
  showAuthentication: boolean;
}

export function CreateUserAccessTokenInnerForm({ showAuthentication }: Props) {
  const { errors, values, handleSubmit, isValid, dirty } =
    useFormikContext<ApiKeyFormValues>();

  return (
    <Form
      className="form-horizontal"
      onSubmit={handleSubmit}
      autoComplete="off"
    >
      {showAuthentication && (
        <FormControl
          inputId="password"
          label="Current password"
          required
          errors={errors.password}
        >
          <Field
            as={Input}
            type="password"
            id="password"
            name="password"
            value={values.password}
            autoComplete="new-password"
          />
        </FormControl>
      )}
      <FormControl
        inputId="description"
        label="Description"
        required
        errors={errors.description}
      >
        <Field
          as={Input}
          id="description"
          name="description"
          value={values.description}
        />
      </FormControl>
      <LoadingButton
        disabled={!isValid || !dirty}
        data-cy="create-access-token-button"
        isLoading={false}
        loadingText="Adding access token..."
      >
        Add access token
      </LoadingButton>
    </Form>
  );
}
