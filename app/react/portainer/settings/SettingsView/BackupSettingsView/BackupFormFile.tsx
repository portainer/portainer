import { Download } from 'lucide-react';
import { Formik, Form, Field } from 'formik';

import { success as notifySuccess } from '@/portainer/services/notifications';

import { LoadingButton } from '@@/buttons/LoadingButton';
import { FormSection } from '@@/form-components/FormSection';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { Switch } from '@@/form-components/SwitchField/Switch';

import { BackupFileSettings, DownloadBackupPayload } from './types';
import { useDownloadBackupMutation } from './queries';
import { validationSchema } from './BackupFormFile.validation';

interface Props {
  settings: BackupFileSettings;
}

export function BackupFormFile({ settings }: Props) {
  const downloadMutate = useDownloadBackupMutation();

  return (
    <Formik
      initialValues={settings}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      validateOnMount
      validateOnChange
    >
      {({
        values,
        errors,
        handleSubmit,
        isSubmitting,
        setFieldValue,
        isValid,
      }) => (
        <Form className="form-horizontal" onSubmit={handleSubmit}>
          <FormSection title="Security settings" />
          <FormControl
            inputId="password-switch"
            label="Password Protect"
            size="small"
            errors={errors.passwordProtect}
          >
            <Switch
              id="password-switch"
              name="password-switch"
              className="space-right"
              checked={values.passwordProtect}
              data-cy="settings-passwordProtectLocal"
              onChange={(e) => setFieldValue('passwordProtect', e)}
            />
          </FormControl>

          {values.passwordProtect && (
            <FormControl
              inputId="password"
              label="Password"
              size="small"
              errors={errors.password}
            >
              <Field
                id="password"
                name="password"
                type="password"
                as={Input}
                data-cy="settings-backupLocalPassword"
                required
              />
            </FormControl>
          )}

          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                loadingText="Downloading settings..."
                isLoading={isSubmitting}
                disabled={!isValid || downloadMutate.isError}
                className="!ml-0"
                icon={Download}
              >
                Download backup
              </LoadingButton>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );

  async function onSubmit(values: BackupFileSettings) {
    const payload: DownloadBackupPayload = {
      password: '',
    };
    if (values.passwordProtect) {
      payload.password = values.password;
    }

    downloadMutate.mutate(payload, {
      onSuccess() {
        notifySuccess('Success', 'Downloaded backup successfully');
      },
    });
  }
}
