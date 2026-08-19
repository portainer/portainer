import { Form, Formik } from 'formik';
import * as yup from 'yup';
import { useCallback } from 'react';

import { notifySuccess } from '@/portainer/services/notifications';
import { useUpdateSettingsMutation } from '@/react/portainer/settings/queries';
import { Settings } from '@/react/portainer/settings/types';

import { LoadingButton } from '@@/buttons/LoadingButton';

import { EnabledWaitingRoomSwitch } from './EnableWaitingRoomSwitch';

interface FormValues {
  EnableWaitingRoom: boolean;
}
const validation = yup.object({
  EnableWaitingRoom: yup.boolean(),
});

interface Props {
  settings: Settings;
}

export function AutoEnvCreationSettingsForm({ settings }: Props) {
  const initialValues: FormValues = {
    EnableWaitingRoom: !settings.TrustOnFirstConnect,
  };

  const mutation = useUpdateSettingsMutation();

  const { mutate: updateSettings } = mutation;

  const handleSubmit = useCallback(
    (variables: Partial<FormValues>) => {
      updateSettings(
        { TrustOnFirstConnect: !variables.EnableWaitingRoom },
        {
          onSuccess() {
            notifySuccess(
              'Success',
              'Successfully updated Automatic Environment Creation settings'
            );
          },
        }
      );
    },
    [updateSettings]
  );

  return (
    <Formik<FormValues>
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validation}
      validateOnMount
      enableReinitialize
    >
      {({ isValid, dirty }) => (
        <Form className="form-horizontal">
          <EnabledWaitingRoomSwitch />

          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                loadingText="generating..."
                data-cy="save-auto-env-settings-button"
                isLoading={mutation.isLoading}
                disabled={!isValid || !dirty}
                className="!ml-0"
              >
                Save settings
              </LoadingButton>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}
