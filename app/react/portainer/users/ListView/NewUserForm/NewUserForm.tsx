import { PlusIcon } from 'lucide-react';
import { Form, Formik } from 'formik';
import { useTranslation } from 'react-i18next';

import { useCurrentUser } from '@/react/hooks/useUser';
import { usePublicSettings } from '@/react/portainer/settings/queries';
import { AuthenticationMethod } from '@/react/portainer/settings/types';
import { Role } from '@/portainer/users/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { Widget } from '@@/Widget';
import { FormActions } from '@@/form-components/FormActions';

import { useTeams } from '../../teams/queries';
import { useCreateUserMutation } from '../../queries/useCreateUserMutation';

import { UsernameField } from './UsernameField';
import { PasswordField } from './PasswordField';
import { ConfirmPasswordField } from './ConfirmPasswordField';
import { FormValues } from './FormValues';
import { TeamsFieldset } from './TeamsFieldset';
import { useValidation } from './useValidation';

export function NewUserForm() {
  const { t } = useTranslation();
  const { isPureAdmin } = useCurrentUser();
  const teamsQuery = useTeams(!isPureAdmin);
  const settingsQuery = usePublicSettings();
  const createUserMutation = useCreateUserMutation();
  const validation = useValidation();

  if (!teamsQuery.data || !settingsQuery.data) {
    return null;
  }

  const { AuthenticationMethod: authMethod } = settingsQuery.data;

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <Widget.Title icon={PlusIcon} title={t('users.add_user')} />
          <Widget.Body>
            <Formik<FormValues>
              initialValues={{
                username: '',
                password: '',
                confirmPassword: '',
                isAdmin: false,
                teams: [],
              }}
              validationSchema={validation}
              validateOnMount
              onSubmit={(values, { resetForm }) => {
                createUserMutation.mutate(
                  {
                    password: values.password,
                    username: values.username,
                    role: values.isAdmin ? Role.Admin : Role.Standard,
                    teams: values.teams,
                  },
                  {
                    onSuccess() {
                      notifySuccess(
                        t('users.user_created'),
                        values.username
                      );
                      resetForm();
                    },
                  }
                );
              }}
            >
              {({ errors, isValid }) => (
                <Form className="form-horizontal">
                  <UsernameField authMethod={authMethod} />

                  {authMethod === AuthenticationMethod.Internal && (
                    <>
                      <PasswordField />

                      <ConfirmPasswordField />
                    </>
                  )}

                  <TeamsFieldset />

                  <FormActions
                    data-cy="user-createUserButton"
                    submitLabel={t('users.create_user')}
                    isLoading={createUserMutation.isLoading}
                    isValid={isValid}
                    loadingText={t('users.creating_user')}
                    errors={errors}
                    submitIcon={PlusIcon}
                  />
                </Form>
              )}
            </Formik>
          </Widget.Body>
        </Widget>
      </div>
    </div>
  );
}
