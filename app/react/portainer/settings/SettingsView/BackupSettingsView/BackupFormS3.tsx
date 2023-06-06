import { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import { Upload } from 'lucide-react';
import clsx from 'clsx';

import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { success as notifySuccess } from '@/portainer/services/notifications';
import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { FormSection } from '@@/form-components/FormSection';
import { FormControl } from '@@/form-components/FormControl';
import { LoadingButton } from '@@/buttons/LoadingButton';
import { Switch } from '@@/form-components/SwitchField/Switch';
import { Input } from '@@/form-components/Input';

import {
  useBackupS3Settings,
  useExportS3BackupMutation,
  useBackupS3SettingsMutation,
} from './queries';
import { BackupS3Model } from './types';
import { validationSchema } from './BackupFormS3.validation';

interface BackupS3Settings {
  passwordProtectS3: boolean;
  passwordS3: string;
  scheduleAutomaticBackup: boolean;
  cronRule: string;
  accessKeyID: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  s3CompatibleHost: string;
}

export function BackupFormS3() {
  const [isExport, setIsExport] = useState(false);
  const limitedToBE = isLimitedToBE(FeatureId.S3_BACKUP_SETTING);

  const exportS3Mutate = useExportS3BackupMutation();

  const updateS3Mutate = useBackupS3SettingsMutation();

  const settingsQuery = useBackupS3Settings();
  if (!settingsQuery.data) {
    return null;
  }

  const backupS3Settings: BackupS3Settings = {
    passwordS3: settingsQuery.data.password,
    cronRule: settingsQuery.data.cronRule,
    accessKeyID: settingsQuery.data.accessKeyID,
    secretAccessKey: settingsQuery.data.secretAccessKey,
    region: settingsQuery.data.region,
    bucketName: settingsQuery.data.bucketName,
    s3CompatibleHost: settingsQuery.data.s3CompatibleHost,
    scheduleAutomaticBackup: !!settingsQuery.data.cronRule,
    passwordProtectS3: !!settingsQuery.data.password,
  };

  return (
    <Formik
      initialValues={backupS3Settings}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      validateOnMount
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
          <FormControl
            inputId="schedule-backups"
            label="Schedule automatic backups"
            size="small"
            errors={errors.scheduleAutomaticBackup}
          >
            <Switch
              id="schedule-backups"
              name="schedule-automatic-backup"
              featureId={FeatureId.S3_BACKUP_SETTING}
              className="space-right"
              checked={values.scheduleAutomaticBackup}
              onChange={(e) => setFieldValue('scheduleAutomaticBackup', e)}
            />
          </FormControl>

          {values.scheduleAutomaticBackup && (
            <FormControl
              inputId="cron_rule"
              label="Cron rule"
              size="small"
              errors={errors.cronRule}
            >
              <Field
                id="cron_rule"
                name="cronRule"
                type="text"
                as={Input}
                placeholder="0 2 * * *"
                data-cy="settings-backupCronRuleInput"
                className={clsx({ 'limited-be': limitedToBE })}
                disabled={limitedToBE}
              />
            </FormControl>
          )}

          <FormControl
            label="Access key ID"
            inputId="access_key_id"
            errors={errors.accessKeyID}
          >
            <Field
              id="access_key_id"
              name="accessKeyID"
              type="text"
              as={Input}
              data-cy="settings-accessKeyIdInput"
              className={clsx({ 'limited-be': limitedToBE })}
              disabled={limitedToBE}
            />
          </FormControl>

          <FormControl
            label="Secret access key"
            inputId="secret_access_key"
            errors={errors.secretAccessKey}
          >
            <Field
              id="secret_access_key"
              name="secretAccessKey"
              type="password"
              as={Input}
              data-cy="settings-secretAccessKeyInput"
              className={clsx({ 'limited-be': limitedToBE })}
              disabled={limitedToBE}
            />
          </FormControl>

          <FormControl label="Region" inputId="region" errors={errors.region}>
            <Field
              id="region"
              name="region"
              type="text"
              as={Input}
              placeholder="default region is us-east-1 if left empty"
              data-cy="settings-backupRegionInput"
              className={clsx({ 'limited-be': limitedToBE })}
              disabled={limitedToBE}
            />
          </FormControl>

          <FormControl
            label="Bucket name"
            inputId="bucket_name"
            errors={errors.bucketName}
          >
            <Field
              id="bucket_name"
              name="bucketName"
              type="text"
              as={Input}
              data-cy="settings-backupBucketNameInput"
              className={clsx({ 'limited-be': limitedToBE })}
              disabled={limitedToBE}
            />
          </FormControl>

          <FormControl
            label="S3 compatible host"
            inputId="s3_compatible_host"
            tooltip="Hostname of a S3 service"
            errors={errors.s3CompatibleHost}
          >
            <Field
              id="s3_compatible_host"
              name="s3CompatibleHost"
              type="text"
              as={Input}
              placeholder="leave empty for AWS S3"
              data-cy="settings-backupS3CompatibleHostInput"
              className={clsx({ 'limited-be': limitedToBE })}
              disabled={limitedToBE}
            />
          </FormControl>

          <FormSection title="Security settings">
            <FormControl
              inputId="password-s3-switch"
              label="Password Protect"
              size="small"
              errors={errors.passwordProtectS3}
            >
              <Switch
                id="password-s3-switch"
                name="password-s3-switch"
                className="space-right"
                checked={values.passwordProtectS3}
                data-cy="settings-passwordProtectToggleS3"
                onChange={(e) => setFieldValue('passwordProtectS3', e)}
              />
            </FormControl>

            {values.passwordProtectS3 && (
              <FormControl
                inputId="password-s3"
                label="Password"
                size="small"
                errors={errors.passwordS3}
              >
                <Field
                  id="password-s3"
                  name="passwordS3"
                  type="password"
                  as={Input}
                  data-cy="settings-backups3pw"
                  required
                />
              </FormControl>
            )}
          </FormSection>

          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                loadingText="Exporting..."
                isLoading={isSubmitting}
                className={clsx('!ml-0', { 'limited-be': limitedToBE })}
                disabled={!isValid || limitedToBE}
                data-cy="settings-exportBackupS3Button"
                icon={Upload}
                onClick={() => {
                  setIsExport(true);
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
                loadingText="Saving settings..."
                isLoading={isSubmitting}
                className={clsx('!ml-0', { 'limited-be': limitedToBE })}
                disabled={!isValid || limitedToBE}
                data-cy="settings-saveBackupSettingsButton"
                onClick={() => {
                  setIsExport(false);
                }}
              >
                Save backup settings
              </LoadingButton>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );

  async function onSubmit(values: BackupS3Settings) {
    const payload: BackupS3Model = {
      password: values.passwordProtectS3 ? values.passwordS3 : '',
      cronRule: values.scheduleAutomaticBackup ? values.cronRule : '',
      accessKeyID: values.accessKeyID,
      secretAccessKey: values.secretAccessKey,
      region: values.region,
      bucketName: values.bucketName,
      s3CompatibleHost: values.s3CompatibleHost,
    };

    if (isExport) {
      exportS3Mutate.mutate(payload, {
        onSuccess() {
          notifySuccess('Success', 'Exported backup to S3 successfully');
        },
      });
    } else {
      updateS3Mutate.mutate(payload, {
        onSuccess() {
          notifySuccess('Success', 'S3 backup settings saved successfully');
        },
      });
    }
  }
}
