import { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import { Download, Upload } from 'lucide-react';
import clsx from 'clsx';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';

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
} from './queries';
import { backupFormType, options } from './backup-options';
import { FormValues, DownloadBackupPayload, BackupS3Model } from './types';
import { validationSchema as buildBackupValidationSchema } from './BackupForm.validation';

interface Props {
  settings: FormValues;
}

export function BackupForm({ settings }: Props) {
  const [backupType, setBackupType] = useState(options[0].value);

  const limitedToBE = isLimitedToBE(FeatureId.S3_BACKUP_SETTING);

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
                    name="cron_rule"
                    type="text"
                    as={Input}
                    placeholder="0 2 * * *"
                    data-cy="settings-backupCronRuleInput"
                    className={clsx({ 'limited-be': limitedToBE })}
                    disabled={limitedToBE}
                    value={values.cronRule}
                    onChange={(e) => setFieldValue('cronRule', e.target.value)}
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
                  name="access_key_id"
                  type="text"
                  as={Input}
                  data-cy="settings-accessKeyIdInput"
                  className={clsx({ 'limited-be': limitedToBE })}
                  disabled={limitedToBE}
                  value={values.accessKeyID}
                  onChange={(e) => setFieldValue('accessKeyID', e.target.value)}
                />
              </FormControl>

              <FormControl
                label="Secret access key"
                inputId="secret_access_key"
                errors={errors.secretAccessKey}
              >
                <Field
                  id="secret_access_key"
                  name="secret_access_key"
                  type="password"
                  as={Input}
                  data-cy="settings-secretAccessKeyInput"
                  className={clsx({ 'limited-be': limitedToBE })}
                  disabled={limitedToBE}
                  value={values.secretAccessKey}
                  onChange={(e) =>
                    setFieldValue('secretAccessKey', e.target.value)
                  }
                />
              </FormControl>

              <FormControl
                label="Region"
                inputId="region"
                errors={errors.region}
              >
                <Field
                  id="region"
                  name="region"
                  type="text"
                  as={Input}
                  placeholder="default region is us-east-1 if left empty"
                  data-cy="settings-backupRegionInput"
                  className={clsx({ 'limited-be': limitedToBE })}
                  disabled={limitedToBE}
                  value={values.region}
                  onChange={(e) => setFieldValue('region', e.target.value)}
                />
              </FormControl>

              <FormControl
                label="Bucket name"
                inputId="bucket_name"
                errors={errors.bucketName}
              >
                <Field
                  id="bucket_name"
                  name="bucket_name"
                  type="text"
                  as={Input}
                  data-cy="settings-backupBucketNameInput"
                  className={clsx({ 'limited-be': limitedToBE })}
                  disabled={limitedToBE}
                  value={values.bucketName}
                  onChange={(e) => setFieldValue('bucketName', e.target.value)}
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
                  name="s3_compatible_host"
                  type="text"
                  as={Input}
                  placeholder="leave empty for AWS S3"
                  data-cy="settings-backupS3CompatibleHostInput"
                  className={clsx({ 'limited-be': limitedToBE })}
                  disabled={limitedToBE}
                  value={values.s3CompatibleHost}
                  onChange={(e) =>
                    setFieldValue('s3CompatibleHost', e.target.value)
                  }
                />
              </FormControl>

              <FormSection title="Security settings" />
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
                    name="password-s3"
                    type="password"
                    as={Input}
                    data-cy="settings-backups3pw"
                    required
                    value={values.passwordS3}
                    onChange={(e) =>
                      setFieldValue('passwordS3', e.target.value)
                    }
                  />
                </FormControl>
              )}

              <div className="form-group">
                <div className="col-sm-12">
                  <LoadingButton
                    name="submitButton"
                    isLoading={isSubmitting}
                    className={clsx('!ml-0', { 'limited-be': limitedToBE })}
                    disabled={!isValid || isExportS3Error || limitedToBE}
                    data-cy="settings-exportBackupS3Button"
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
                    className={clsx('!ml-0', { 'limited-be': limitedToBE })}
                    disabled={!isValid || isUpdateS3Error || limitedToBE}
                    data-cy="settings-saveBackupSettingsButton"
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
                    value={values.password}
                    onChange={(e) => setFieldValue('password', e.target.value)}
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
        password: values.passwordProtectS3 ? values.passwordS3 : '',
        cronRule: values.scheduleAutomaticBackup ? values.cronRule : '',
        accessKeyID: values.accessKeyID,
        secretAccessKey: values.secretAccessKey,
        region: values.region,
        bucketName: values.bucketName,
        s3CompatibleHost: values.s3CompatibleHost,
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
      if (values.passwordProtect) {
        payload.password = values.password;
      }
      downloadMutate(payload);
    }
  }
}
