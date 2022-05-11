import { Field, Form, Formik } from 'formik';
import * as yup from 'yup';
import { useCallback, useEffect } from 'react';

import { LoadingButton } from '@/portainer/components/Button/LoadingButton';
import { FormControl } from '@/portainer/components/form-components/FormControl';
import { FormSectionTitle } from '@/portainer/components/form-components/FormSectionTitle';
import { Input } from '@/portainer/components/form-components/Input';
import { baseHref } from '@/portainer/helpers/pathHelper';
import { notifySuccess } from '@/portainer/services/notifications';
import { useUpdateSettingsMutation } from '@/portainer/settings/settings.service';

import { Settings } from '../types';

import { EnabledWaitingRoomSwitch } from './EnableWaitingRoomSwitch';

interface FormValues {
  EdgePortainerUrl: string;
  TrustOnFirstConnect: boolean;
}
const validation = yup.object({
  TrustOnFirstConnect: yup.boolean(),
  EdgePortainerUrl: yup
    .string()
    .test(
      'url',
      'URL should be a valid URI and cannot include localhost',
      (value) => {
        if (!value) {
          return false;
        }
        try {
          const url = new URL(value);
          return !!url.hostname && url.hostname !== 'localhost';
        } catch {
          return false;
        }
      }
    )
    .required('URL is required'),
});

interface Props {
  settings: Settings;
}

const defaultUrl = buildDefaultUrl();

export function AutoEnvCreationSettingsForm({ settings }: Props) {
  const url = settings.EdgePortainerUrl;

  const initialValues = {
    EdgePortainerUrl: url || defaultUrl,
    TrustOnFirstConnect: settings.TrustOnFirstConnect,
  };

  const mutation = useUpdateSettingsMutation();

  const { mutate: updateSettings } = mutation;

  const handleSubmit = useCallback(
    (variables: Partial<FormValues>) => {
      updateSettings(variables, {
        onSuccess() {
          notifySuccess(
            'Successfully updated Automatic Environment Creation settings'
          );
        },
      });
    },
    [updateSettings]
  );

  useEffect(() => {
    if (!url && validation.isValidSync({ EdgePortainerUrl: defaultUrl })) {
      updateSettings({ EdgePortainerUrl: defaultUrl });
    }
  }, [updateSettings, url]);

  return (
    <Formik<FormValues>
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validation}
      validateOnMount
      enableReinitialize
    >
      {({ errors, isValid, dirty }) => (
        <Form className="form-horizontal">
          <FormSectionTitle>Configuration</FormSectionTitle>

          <FormControl
            label="Portainer URL"
            tooltip="URL of the Portainer instance that the agent will use to initiate the communications."
            inputId="url-input"
            errors={errors.EdgePortainerUrl}
          >
            <Field as={Input} id="url-input" name="EdgePortainerUrl" />
          </FormControl>

          <EnabledWaitingRoomSwitch />

          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                loadingText="generating..."
                isLoading={mutation.isLoading}
                disabled={!isValid || !dirty}
              >
                Save Settings
              </LoadingButton>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}

function buildDefaultUrl() {
  const baseHREF = baseHref();
  return window.location.origin + (baseHREF !== '/' ? baseHREF : '');
}
