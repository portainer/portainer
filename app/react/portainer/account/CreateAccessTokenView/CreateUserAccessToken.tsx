import { Formik } from 'formik';
import { useState } from 'react';

import { useCurrentUser } from '@/react/hooks/useUser';
import { useAnalytics } from '@/react/hooks/useAnalytics';
import { AuthenticationMethod } from '@/react/portainer/settings/types';

import { Widget } from '@@/Widget';
import { PageHeader } from '@@/PageHeader';

import { usePublicSettings } from '../../settings/queries/usePublicSettings';

import { ApiKeyFormValues } from './types';
import { getAPITokenValidationSchema } from './CreateUserAcccessToken.validation';
import { useCreateUserAccessTokenMutation } from './useCreateUserAccessTokenMutation';
import { CreateUserAccessTokenInnerForm } from './CreateUserAccessTokenInnerForm';
import { DisplayUserAccessToken } from './DisplayUserAccessToken';

const initialValues: ApiKeyFormValues = {
  password: '',
  description: '',
};

export function CreateUserAccessToken() {
  const mutation = useCreateUserAccessTokenMutation();
  const { user } = useCurrentUser();
  const [newAPIToken, setNewAPIToken] = useState('');
  const { trackEvent } = useAnalytics();
  const settings = usePublicSettings();

  const requirePassword =
    settings.data?.AuthenticationMethod === AuthenticationMethod.Internal ||
    user.Id === 1;

  return (
    <>
      <PageHeader
        title="Create access token"
        breadcrumbs={[
          { label: 'My account', link: 'portainer.account' },
          'Add access token',
        ]}
        reload
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Body>
              {newAPIToken === '' ? (
                <Formik
                  initialValues={initialValues}
                  onSubmit={onSubmit}
                  validationSchema={getAPITokenValidationSchema(
                    requirePassword
                  )}
                >
                  <CreateUserAccessTokenInnerForm
                    showAuthentication={requirePassword}
                  />
                </Formik>
              ) : (
                <DisplayUserAccessToken apikey={newAPIToken} />
              )}
            </Widget.Body>
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

    trackEvent('portainer-account-access-token-create', {
      category: 'portainer',
    });
  }
}
