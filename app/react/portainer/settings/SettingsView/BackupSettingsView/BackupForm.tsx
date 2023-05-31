import { useState, ChangeEvent } from 'react';
import { Formik, Form, Field } from 'formik';
import { Download, Upload } from 'lucide-react';
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
import { FormValues, DownloadBackupPayload } from './types';
import { FeatureId } from '@/react/portainer/feature-flags/enums';

const buildBackupValidationSchema = Yup.object().shape({
  PasswordProtect: Yup.boolean(),
  Password: Yup.string().when('PasswordProtect', {
    is: true,
    then: (schema) => schema.required('This field is required.'),
  }),
  ScheduleAutomaticBackup: Yup.boolean(),
  CronRule: Yup.string().when('ScheduleAutomaticBackup', {
    is: true,
    then: (schema) =>
      schema.required('This field is required.').when('CronRule', {
        is: (val) => val !== '',
        then: (schema) =>
          schema.matches(
            /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} [A-Z]{3}$/,
            'Please enter a valid cron rule.'
          ),
      }),
  }),
  AccessKeyID: Yup.string().when('ScheduleAutomaticBackup', {
    is: true,
    then: (schema) => schema.required('This field is required.'),
  }),
  SecretAccessKey: Yup.string().when('ScheduleAutomaticBackup', {
    is: true,
    then: (schema) => schema.required('This field is required.'),
  }),
  BucketName: Yup.string().when('ScheduleAutomaticBackup', {
    is: true,
    then: (schema) => schema.required('This field is required.'),
  }),
  S3CompatibleHost: Yup.string()
    .nullable()
    .when({
      is: (val) => val !== '',
      then: (schema) =>
        schema.matches(
          /^https?:\/\//,
          'S3 host must begin with http:// or https://.'
        ),
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
            <>
              <FormControl
                inputId="schedule-backups"
                label="Schedule automatic backups"
                size="small"
                errors={errors.ScheduleAutomaticBackup}
              >
                <Switch
                  id="schedule-backups"
                  name="s3-backup-setting"
                  feature-id="s3BackupFeatureId"
                  className="space-right"
                  checked={values.ScheduleAutomaticBackup}
                  onChange={(e) => setFieldValue('ScheduleAutomaticBackup', e)}
                />
              </FormControl>

              {values.ScheduleAutomaticBackup && (
                <FormControl
                  inputId="cron_rule"
                  label="Cron rule"
                  size="small"
                  errors={errors.CronRule}
                >
                  <Field
                    id="cron_rule"
                    name="cron_rule"
                    type="text"
                    as={Input}
                    placeholder="0 2 * * *"
                    data-cy="settings-backupCronRuleInput"
                    limited-feature-dir={FeatureId.S3_BACKUP_SETTING}
                    limited-feature-disabled
                    limited-feature-class="limited-be"
                    required
                    value={values.CronRule}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFieldValue('CronRule', e.target.value)
                    }
                  />
                </FormControl>
              )}

              <FormControl
                label="Access key ID"
                inputId="access_key_id"
                errors={errors.AccessKeyID}
              >
                <Field
                  id="access_key_id"
                  name="access_key_id"
                  type="text"
                  as={Input}
                  required
                  data-cy="settings-accessKeyIdInput"
                  limited-feature-dir={FeatureId.S3_BACKUP_SETTING}
                  limited-feature-disabled
                  limited-feature-class="limited-be"
                  value={values.AccessKeyID}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFieldValue('AccessKeyID', e.target.value)
                  }
                />
              </FormControl>

              <FormControl
                label="Secret access key"
                inputId="secret_access_key"
                errors={errors.SecretAccessKey}
              >
                <Field
                  id="secret_access_key"
                  name="secret_access_key"
                  type="password"
                  as={Input}
                  required
                  data-cy="settings-secretAccessKeyInput"
                  limited-feature-dir={FeatureId.S3_BACKUP_SETTING}
                  limited-feature-disabled
                  limited-feature-class="limited-be"
                  value={values.SecretAccessKey}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFieldValue('SecretAccessKey', e.target.value)
                  }
                />
              </FormControl>

              <FormControl
                label="Region"
                inputId="region"
                errors={errors.Region}
              >
                <Field
                  id="region"
                  name="region"
                  type="text"
                  as={Input}
                  placeholder="default region is us-east-1 if left empty"
                  data-cy="settings-backupRegionInput"
                  limited-feature-dir={FeatureId.S3_BACKUP_SETTING}
                  limited-feature-disabled
                  limited-feature-class="limited-be"
                  value={values.Region}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFieldValue('Region', e.target.value)
                  }
                />
              </FormControl>

              <FormControl
                label="Bucket name"
                inputId="bucket_name"
                errors={errors.BucketName}
              >
                <Field
                  id="bucket_name"
                  name="bucket_name"
                  type="text"
                  as={Input}
                  required
                  data-cy="settings-backupBucketNameInput"
                  limited-feature-dir={FeatureId.S3_BACKUP_SETTING}
                  limited-feature-class="limited-be"
                  value={values.BucketName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFieldValue('BucketName', e.target.value)
                  }
                />
              </FormControl>

              <FormControl
                label="S3 compatible host"
                inputId="s3_compatible_host"
                tooltip="Hostname of a S3 service"
                errors={errors.S3CompatibleHost}
              >
                <Field
                  id="s3_compatible_host"
                  name="s3_compatible_host"
                  type="text"
                  as={Input}
                  placeholder="leave empty for AWS S3"
                  data-cy="settings-backupS3CompatibleHostInput"
                  limited-feature-dir={FeatureId.S3_BACKUP_SETTING}
                  limited-feature-class="limited-be"
                  value={values.S3CompatibleHost}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFieldValue('S3CompatibleHost', e.target.value)
                  }
                />
              </FormControl>

              <FormSection title="Security settings" />
              <FormControl
                inputId="password-s3-switch"
                label="Password Protect"
                size="small"
                errors={errors.PasswordProtect}
              >
                <Switch
                  id="password-s3-switch"
                  name="password-s3-switch"
                  className="space-right"
                  checked={values.PasswordProtect}
                  data-cy="settings-passwordProtectToggleS3"
                  onChange={(e) => setFieldValue('PasswordProtect', e)}
                />
              </FormControl>

              {values.PasswordProtect && (
                <FormControl
                  inputId="password-s3"
                  label="Password"
                  size="small"
                  errors={errors.Password}
                >
                  <Field
                    id="password-s3"
                    name="password-s3"
                    type="password"
                    as={Input}
                    data-cy="settings-backups3pw"
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
                    // isLoading={mutation.isLoading}
                    disabled={!isValid}
                    className="!ml-0"
                    data-cy="settings-exportBackupS3Button"
                    limited-feature-dir={FeatureId.S3_BACKUP_SETTING}
                    limited-feature-disabled
                    limited-feature-class="limited-be"
                    icon={Upload}
                  >
                    Export backup
                  </LoadingButton>
                </div>
              </div>
              <div className="form-group">
                <hr />
                <div className="col-sm-12">
                  <LoadingButton
                    loadingText="Saving settings..."
                    // isLoading={mutation.isLoading}
                    // disabled={!isValid || !dirty}
                    className="!ml-0"
                    limited-feature-dir={FeatureId.S3_BACKUP_SETTING}
                    limited-feature-disabled
                    limited-feature-class="limited-be"
                    data-cy="settings-saveBackupSettingsButton"
                  >
                    Save backup settings
                  </LoadingButton>
                </div>
              </div>
            </>
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
                  data-cy="settings-passwordProtectLocal"
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
                    loadingText="Downloading settings..."
                    isLoading={isSubmitting}
                    disabled={!isValid || isError}
                    className="!ml-0"
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
