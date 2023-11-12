import { Field, Form, Formik, useFormikContext } from 'formik';
import { useState } from 'react';
import { useRouter } from '@uirouter/react';

import { useCurrentUser } from '@/react/hooks/useUser';

import { Widget, WidgetBody } from '@@/Widget';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { Button, CopyButton, LoadingButton } from '@@/buttons';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { TextTip } from '@@/Tip/TextTip';
import { PageHeader } from '@@/PageHeader';

import { ApiKeyFormValues } from './types';
import { getAPITokenValidationSchema } from './CreateUserAcccessToken.validation';
import { useCreateUserAccessTokenMutation } from './useCreateUserAccessTokenMutation';

const initialValues: ApiKeyFormValues = {
  password: '',
  description: '',
};

export function CreateUserAccessToken() {
  const mutation = useCreateUserAccessTokenMutation();
  const { user } = useCurrentUser();
  const [newAPIToken, setNewAPIToken] = useState('');

  return (
    <>
      <PageHeader
        title="Create access token"
        breadcrumbs={[
          { label: 'My account', link: 'portainer.account' },
          { label: 'Add access token' },
        ]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetBody>
              {newAPIToken === '' ? (
                <Formik
                  initialValues={initialValues}
                  onSubmit={onSubmit}
                  validationSchema={getAPITokenValidationSchema}
                >
                  <CreateUserAccessTokenInnerForm />
                </Formik>
              ) : (
                DisplayUserAccessToken(newAPIToken)
              )}
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </>
  );

  async function onSubmit(values: ApiKeyFormValues) {
    mutation.mutate(
      { values, userid: user.Id },
      {
        onSuccess(response) {
          setNewAPIToken(response);
        },
      }
    );
  }
}

function CreateUserAccessTokenInnerForm() {
  const { errors, values, handleSubmit, isValid, dirty } =
    useFormikContext<ApiKeyFormValues>();

  return (
    <Form
      className="form-horizontal"
      onSubmit={handleSubmit}
      autoComplete="off"
    >
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
        isLoading={false}
        loadingText="Adding access token..."
      >
        Add access token
      </LoadingButton>
    </Form>
  );
}

function DisplayUserAccessToken(apikey: string) {
  const router = useRouter();
  return (
    <>
      <FormSectionTitle>New access token</FormSectionTitle>
      <TextTip>
        Please copy the new access token. You won&#39;t be able to view the
        token again.
      </TextTip>
      <div className="pt-5">
        <div className="inline-flex">
          <div className="">{apikey}</div>
          <div>
            <CopyButton copyText={apikey} color="link" />
          </div>
        </div>
        <hr />
      </div>
      <Button
        type="button"
        onClick={() => router.stateService.go('portainer.account')}
      >
        Done
      </Button>
    </>
  );
}
