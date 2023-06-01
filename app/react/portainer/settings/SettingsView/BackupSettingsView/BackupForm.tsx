import { useState, ChangeEvent } from 'react';
import { Formik, Form, Field } from 'formik';
import { Download, Upload } from 'lucide-react';

import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { FormSection } from '@@/form-components/FormSection';
import { FormControl } from '@@/form-components/FormControl';
import { BoxSelector } from '@@/BoxSelector';
import { Input } from '@@/form-components/Input';
import { Switch } from '@@/form-components/SwitchField/Switch';
import { LoadingButton } from '@@/buttons/LoadingButton';

import {
  useDownloadBackupMutation,
  useExportS3BackupMutation,
  useBackupS3SettingsMutation,
} from '../../queries/useBackupSettingsMutation';

import { backupFormType, options } from './backup-options';
import { FormValues, DownloadBackupPayload, BackupS3Model } from './types';
import { validationSchema as buildBackupValidationSchema } from './BackupForm.validation';

interface Props {
  settings: FormValues;
}

export function BackupForm({ settings }: Props) {
  const [backupType, setBackupType] = useState(options[0].value);

  const { mutate: downloadMutate, isError: isDownloadError } =
    useDownloadBackupMutation();

  const { mutate: exportS3Mutate, isError: isExportS3Error } =
    useExportS3BackupMutation();

  const { mutate: updateS3Mutate, isError: isUpdateS3Error } =
    useBackupS3SettingsMutation();

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
                    limited-feature-disabled="true"
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
                  data-cy="settings-accessKeyIdInput"
                  limited-feature-dir={FeatureId.S3_BACKUP_SETTING}
                  limited-feature-disabled="true"
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
                  data-cy="settings-secretAccessKeyInput"
                  limited-feature-dir={FeatureId.S3_BACKUP_SETTING}
                  limited-feature-disabled="true"
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
                  limited-feature-disabled="true"
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
                errors={errors.PasswordProtectS3}
              >
                <Switch
                  id="password-s3-switch"
                  name="password-s3-switch"
                  className="space-right"
                  checked={values.PasswordProtectS3}
                  data-cy="settings-passwordProtectToggleS3"
                  onChange={(e) => setFieldValue('PasswordProtectS3', e)}
                />
              </FormControl>

              {values.PasswordProtectS3 && (
                <FormControl
                  inputId="password-s3"
                  label="Password"
                  size="small"
                  errors={errors.PasswordS3}
                >
                  <Field
                    id="password-s3"
                    name="password-s3"
                    type="password"
                    as={Input}
                    data-cy="settings-backups3pw"
                    required
                    value={values.PasswordS3}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFieldValue('PasswordS3', e.target.value)
                    }
                  />
                </FormControl>
              )}

              <div className="form-group">
                <div className="col-sm-12">
                  <LoadingButton
                    name="submitButton"
                    isLoading={isSubmitting}
                    disabled={!isValid || isExportS3Error}
                    className="!ml-0"
                    data-cy="settings-exportBackupS3Button"
                    limited-feature-dir={FeatureId.S3_BACKUP_SETTING}
                    limited-feature-disabled="true"
                    limited-feature-class="limited-be"
                    icon={Upload}
                    value="export"
                    onClick={() => {
                      setFieldValue('submitButton', 'export');
                    }}
                  >
                    Export backup
                  </LoadingButton>
                </div>
              </div>
              <div className="form-group">
                <hr />
                <div className="col-sm-12">
                  <LoadingButton
                    name="submitButton"
                    loadingText="Saving settings..."
                    isLoading={isSubmitting}
                    disabled={!isValid || isUpdateS3Error}
                    className="!ml-0"
                    data-cy="settings-saveBackupSettingsButton"
                    limited-feature-dir={FeatureId.S3_BACKUP_SETTING}
                    limited-feature-disabled="true"
                    limited-feature-class="limited-be"
                    value="save"
                    onClick={() => {
                      setFieldValue('submitButton', 'save');
                    }}
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
                    name="submitButton"
                    loadingText="Downloading settings..."
                    isLoading={isSubmitting}
                    disabled={!isValid || isDownloadError}
                    className="!ml-0"
                    icon={Download}
                    value="download"
                    onClick={() => {
                      setFieldValue('submitButton', 'download');
                    }}
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
    if (backupType === backupFormType.S3) {
      const payload: BackupS3Model = {
        Password: values.PasswordProtectS3 ? values.PasswordS3 : '',
        CronRule: values.ScheduleAutomaticBackup ? values.CronRule : '',
        AccessKeyID: values.AccessKeyID,
        SecretAccessKey: values.SecretAccessKey,
        Region: values.Region,
        BucketName: values.BucketName,
        S3CompatibleHost: values.S3CompatibleHost,
      };

      if (values.submitButton === 'save') {
        updateS3Mutate(payload);
      } else if (values.submitButton === 'export') {
        exportS3Mutate(payload);
      }
    } else {
      const payload: DownloadBackupPayload = {
        password: '',
      };
      if (values.PasswordProtect) {
        payload.password = values.Password;
      }
      downloadMutate(payload);
    }
  }
}
