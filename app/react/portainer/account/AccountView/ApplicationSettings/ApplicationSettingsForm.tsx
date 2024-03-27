import { Form, Formik } from 'formik';

import { useCurrentUser } from '@/react/hooks/useUser';
import { notifySuccess } from '@/portainer/services/notifications';
import { updateAxiosAdapter } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { TextTip } from '@@/Tip/TextTip';
import { LoadingButton } from '@@/buttons';
import { SwitchField } from '@@/form-components/SwitchField';

import { useUpdateUserMutation } from '../../useUpdateUserMutation';

type FormValues = {
  useCache: boolean;
};

export function ApplicationSettingsForm() {
  const { user } = useCurrentUser();
  const updateSettingsMutation = useUpdateUserMutation();

  const initialValues = {
    useCache: user.UseCache,
  };

  return (
    <Formik<FormValues>
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validateOnMount
      enableReinitialize
    >
      {({ isValid, dirty, values, setFieldValue }) => (
        <Form className="form-horizontal">
          <TextTip color="orange" className="mb-3">
            Enabling front-end data caching can mean that changes to Kubernetes
            clusters made by other users or outside of Portainer may take up to
            five minutes to show in your session. This caching only applies to
            Kubernetes environments.
          </TextTip>
          <SwitchField
            label="Enable front-end data caching for Kubernetes environments"
            data-cy="account-applicationSettingsUseCacheSwitch"
            checked={values.useCache}
            onChange={(value) => setFieldValue('useCache', value)}
            labelClass="col-lg-2 col-sm-3" // match the label width of the other fields in the page
            fieldClass="!mb-4"
          />
          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                loadingText="Saving..."
                isLoading={updateSettingsMutation.isLoading}
                disabled={!isValid || !dirty}
                className="!ml-0"
                data-cy="account-applicationSettingsSaveButton"
              >
                Save
              </LoadingButton>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );

  function handleSubmit(values: FormValues) {
    updateSettingsMutation.mutate(
      {
        Id: user.Id,
        UseCache: values.useCache,
      },
      {
        onSuccess() {
          updateAxiosAdapter(values.useCache);
          notifySuccess(
            'Success',
            'Successfully updated application settings.'
          );
          // a full reload is required to update the angular $http cache setting
          setTimeout(() => window.location.reload(), 2000); // allow 2s to show the success notification
        },
        ...withError('Unable to update application settings'),
      }
    );
  }
}
