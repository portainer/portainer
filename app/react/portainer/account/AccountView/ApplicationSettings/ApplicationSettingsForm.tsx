import { Form, Formik } from 'formik';
import { useTranslation } from 'react-i18next';

import { useCurrentUser } from '@/react/hooks/useUser';
import { notifySuccess } from '@/portainer/services/notifications';
import { updateAxiosAdapter } from '@/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';

import { TextTip } from '@@/Tip/TextTip';
import { LoadingButton } from '@@/buttons';
import { SwitchField } from '@@/form-components/SwitchField';

import { useUpdateUserMutation } from '../../useUpdateUserMutation';

type FormValues = {
  useCache: boolean;
};

export function ApplicationSettingsForm() {
  const { t } = useTranslation();
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
            {t('portainer_account.cache_warning')}
          </TextTip>
          <SwitchField
            label={t('portainer_account.enable_cache_label')}
            data-cy="account-applicationSettingsUseCacheSwitch"
            checked={values.useCache}
            onChange={(value) => setFieldValue('useCache', value)}
            labelClass="col-lg-2 col-sm-3"
            fieldClass="!mb-4"
          />
          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                loadingText={t('portainer_account.saving')}
                isLoading={updateSettingsMutation.isLoading}
                disabled={!isValid || !dirty}
                className="!ml-0"
                data-cy="account-applicationSettingsSaveButton"
              >
                {t('portainer_account.save')}
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
            t('common.success'),
            t('portainer_account.settings_updated')
          );
          // a full reload is required to update the angular $http cache setting
          setTimeout(() => window.location.reload(), 2000); // allow 2s to show the success notification
        },
        ...withError(t('portainer_account.unable_update_settings')),
      }
    );
  }
}
