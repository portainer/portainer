import { useState, ChangeEvent } from 'react';
import { Formik, Form, Field } from 'formik';
import { Download } from 'lucide-react';
import * as Yup from 'yup';

import * as notifications from '@/portainer/services/notifications';

import { FormSection } from '@@/form-components/FormSection';
import { FormControl } from '@@/form-components/FormControl';
import { BoxSelector } from '@@/BoxSelector';
import { Input } from '@@/form-components/Input';
import { Switch } from '@@/form-components/SwitchField/Switch';
import { LoadingButton } from '@@/buttons/LoadingButton';

import { useDownloadBackupMutation } from '../../queries/useBackupSettingsMutation';

import { options } from './backup-options';
import { FormValues , DownloadBackupPayload } from './types';

const buildBackupValidationSchema = Yup.object().shape({
  PasswordProtect: Yup.boolean(),
  Password: Yup.string().when('PasswordProtect', {
    is: true,
    then: Yup.string().required('This field is required'),
  }),
});

interface Props {
  settings: FormValues;
}

export function BackupForm({ settings }: Props) {
  const [backupType, setBackupType] = useState(options[0].value);

  const { mutate, isError } = useDownloadBackupMutation();

  return (
    <Formik
      initialValues={settings}
      validationSchema={buildBackupValidationSchema}
      onSubmit={onSubmit}
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
          <FormSection title="Backup configuration" />
          <div className="form-group col-sm-12 text-muted small">
            This will back up your Portainer server configuration and does not
            include containers.
          </div>
          <BoxSelector
            slim
            options={options}
            value={backupType}
            onChange={(v) => setBackupType(v)}
            radioName="backup-type"
          />

          {backupType === 's3' ? (
            // <BackupFormS3 />
            <div>placeholder</div>
          ) : (
            <>
              <FormSection title="Security settings" />
              <FormControl
                inputId="password-switch"
                label="Password Protect"
                size="small"
                errors={errors.PasswordProtect}
              >
                <Switch
                  id="password-switch"
                  name="password-switch"
                  className="space-right"
                  checked={values.PasswordProtect}
                  onChange={(e) => setFieldValue('PasswordProtect', e)}
                />
              </FormControl>

              {values.PasswordProtect && (
                <FormControl
                  inputId="password"
                  label="Password"
                  size="small"
                  errors={errors.Password}
                >
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    as={Input}
                    data-cy="settings-backupLocalPassword"
                    required
                    value={values.Password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFieldValue('Password', e.target.value)
                    }
                  />
                </FormControl>
              )}

              <div className="form-group">
                <div className="col-sm-12">
                  <LoadingButton
                    loadingText="Saving settings..."
                    isLoading={isSubmitting}
                    disabled={!isValid || isError}
                    className="!ml-0"
                    data-cy="settings-experimentalButton"
                    icon={Download}
                  >
                    Download backup
                  </LoadingButton>
                </div>
              </div>
            </>
          )}
        </Form>
      )}
    </Formik>
  );

  async function onSubmit(values: FormValues) {
    try {
      if (backupType === 's3') {
        // await mutateAsync(values);
      } else {
        const payload: DownloadBackupPayload = {
          password: '',
        };
        if (values.PasswordProtect) {
          payload.password = values.Password;
        }
        mutate(payload);
      }
    } catch (e) {
      notifications.error('Failure', e as Error, 'Unable to download backup');
    }
  }
}
