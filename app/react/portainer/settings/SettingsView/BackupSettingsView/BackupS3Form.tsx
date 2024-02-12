import { Formik, Form, Field } from 'formik';
import { Upload } from 'lucide-react';
import clsx from 'clsx';

import {
  isLimitedToBE,
  isBE,
} from '@/react/portainer/feature-flags/feature-flags.service';
import { success as notifySuccess } from '@/portainer/services/notifications';
import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { FormControl } from '@@/form-components/FormControl';
import { LoadingButton } from '@@/buttons/LoadingButton';
import { Input } from '@@/form-components/Input';
import { SwitchField } from '@@/form-components/SwitchField';
import { BEOverlay } from '@@/BEFeatureIndicator/BEOverlay';

import {
  useBackupS3Settings,
  useExportS3BackupMutation,
  useUpdateBackupS3SettingsMutation,
} from './queries';
import { BackupS3Model, BackupS3Settings } from './types';
import { validationSchema } from './BackupS3Form.validation';
import { SecurityFieldset } from './SecurityFieldset';

export function BackupS3Form() {
  const limitedToBE = isLimitedToBE(FeatureId.S3_BACKUP_SETTING);

  const exportS3Mutate = useExportS3BackupMutation();

  const updateS3Mutate = useUpdateBackupS3SettingsMutation();

  const settingsQuery = useBackupS3Settings({ enabled: isBE });
  if (settingsQuery.isLoading) {
    return null;
  }

  const settings = settingsQuery.data;

  const backupS3Settings = {
    password: settings?.password || '',
    cronRule: settings?.cronRule || '',
    accessKeyID: settings?.accessKeyID || '',
    secretAccessKey: settings?.secretAccessKey || '',
    region: settings?.region || '',
    bucketName: settings?.bucketName || '',
    s3CompatibleHost: settings?.s3CompatibleHost || '',
    scheduleAutomaticBackup: !!settings?.cronRule,
    passwordProtect: !!settings?.password,
  };

  return (
    <Formik<BackupS3Settings>
      initialValues={backupS3Settings}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      validateOnMount
    >
      {({ values, errors, isSubmitting, setFieldValue, isValid }) => (
        <BEOverlay featureId={FeatureId.S3_BACKUP_SETTING}>
          <Form className="form-horizontal">
            <div className="form-group">
              <div className="col-sm-12">
                <SwitchField
                  name="schedule-automatic-backup"
                  labelClass="col-sm-3 col-lg-2"
                  label="Schedule automatic backups"
                  checked={values.scheduleAutomaticBackup}
                  onChange={(e) => setFieldValue('scheduleAutomaticBackup', e)}
                />
              </div>
            </div>

            {values.scheduleAutomaticBackup && (
              <FormControl
                inputId="cron_rule"
                label="Cron rule"
                size="small"
                errors={errors.cronRule}
                required
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

            <SecurityFieldset
              switchDataCy="settings-passwordProtectToggleS3"
              inputDataCy="settings-backups3pw"
              disabled={limitedToBE}
            />

            <div className="form-group">
              <div className="col-sm-12">
                <LoadingButton
                  type="button"
                  loadingText="Exporting..."
                  isLoading={isSubmitting}
                  className={clsx('!ml-0', { 'limited-be': limitedToBE })}
                  disabled={!isValid || limitedToBE}
                  data-cy="settings-exportBackupS3Button"
                  icon={Upload}
                  onClick={() => {
                    handleExport(values);
                  }}
                >
                  Export backup
                </LoadingButton>
              </div>
            </div>
            <div className="form-group">
              <div className="col-sm-12">
                <LoadingButton
                  loadingText="Saving settings..."
                  isLoading={isSubmitting}
                  className={clsx('!ml-0', { 'limited-be': limitedToBE })}
                  disabled={!isValid || limitedToBE}
                  data-cy="settings-saveBackupSettingsButton"
                >
                  Save backup settings
                </LoadingButton>
              </div>
            </div>
          </Form>
        </BEOverlay>
      )}
    </Formik>
  );

  function handleExport(values: BackupS3Settings) {
    const payload: BackupS3Model = {
      password: values.passwordProtect ? values.password : '',
      cronRule: values.scheduleAutomaticBackup ? values.cronRule : '',
      accessKeyID: values.accessKeyID,
      secretAccessKey: values.secretAccessKey,
      region: values.region,
      bucketName: values.bucketName,
      s3CompatibleHost: values.s3CompatibleHost,
    };
    exportS3Mutate.mutate(payload, {
      onSuccess() {
        notifySuccess('Success', 'Exported backup to S3 successfully');
      },
    });
  }

  async function onSubmit(values: BackupS3Settings) {
    const payload: BackupS3Model = {
      password: values.passwordProtect ? values.password : '',
      cronRule: values.scheduleAutomaticBackup ? values.cronRule : '',
      accessKeyID: values.accessKeyID,
      secretAccessKey: values.secretAccessKey,
      region: values.region,
      bucketName: values.bucketName,
      s3CompatibleHost: values.s3CompatibleHost,
    };

    updateS3Mutate.mutate(payload, {
      onSuccess() {
        notifySuccess('Success', 'S3 backup settings saved successfully');
      },
    });
  }
}
