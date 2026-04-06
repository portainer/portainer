import { Formik, Form, Field } from 'formik';
import { Upload } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import {
  isLimitedToBE,
  isBE,
} from '@/react/portainer/feature-flags/feature-flags.service';
import { success as notifySuccess } from '@/portainer/services/notifications';
import { FeatureId } from '@/react/portainer/feature-flags/enums';
import i18n from '@/i18n';

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
  const { t } = useTranslation();
  const limitedToBE = isLimitedToBE(FeatureId.S3_BACKUP_SETTING);

  const exportS3Mutate = useExportS3BackupMutation();

  const updateS3Mutate = useUpdateBackupS3SettingsMutation();

  const settingsQuery = useBackupS3Settings({ enabled: isBE });
  if (settingsQuery.isInitialLoading) {
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
        <BEOverlay
          featureId={FeatureId.S3_BACKUP_SETTING}
          variant="form-section"
        >
          <Form className="form-horizontal">
            <div className="form-group">
              <div className="col-sm-12">
                <SwitchField
                  name="schedule-automatic-backup"
                  data-cy="settings-scheduleAutomaticBackupSwitch"
                  labelClass="col-sm-3 col-lg-2"
                  label={t('portainer.settings.backup.s3.schedule_automatic_backups')}
                  checked={values.scheduleAutomaticBackup}
                  onChange={(e) => setFieldValue('scheduleAutomaticBackup', e)}
                />
              </div>
            </div>

            {values.scheduleAutomaticBackup && (
              <FormControl
                inputId="cron_rule"
                label={t('portainer.settings.backup.s3.cron_rule')}
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
              label={t('portainer.settings.backup.s3.access_key_id')}
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
              label={t('portainer.settings.backup.s3.secret_access_key')}
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

            <FormControl label={t('portainer.settings.backup.s3.region')} inputId="region" errors={errors.region}>
              <Field
                id="region"
                name="region"
                type="text"
                as={Input}
                placeholder={t('portainer.settings.backup.s3.region_placeholder')}
                data-cy="settings-backupRegionInput"
                className={clsx({ 'limited-be': limitedToBE })}
                disabled={limitedToBE}
              />
            </FormControl>

            <FormControl
              label={t('portainer.settings.backup.s3.bucket_name')}
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
              label={t('portainer.settings.backup.s3.s3_compatible_host')}
              inputId="s3_compatible_host"
              tooltip={t('portainer.settings.backup.s3.s3_compatible_host_tooltip')}
              errors={errors.s3CompatibleHost}
            >
              <Field
                id="s3_compatible_host"
                name="s3CompatibleHost"
                type="text"
                as={Input}
                placeholder={t('portainer.settings.backup.s3.s3_host_placeholder')}
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
                  loadingText={t('portainer.settings.backup.s3.exporting')}
                  isLoading={isSubmitting}
                  className={clsx('!ml-0', { 'limited-be': limitedToBE })}
                  disabled={!isValid || limitedToBE}
                  data-cy="settings-exportBackupS3Button"
                  icon={Upload}
                  onClick={() => {
                    handleExport(values);
                  }}
                >
                  {t('portainer.settings.backup.s3.export_backup')}
                </LoadingButton>
              </div>
            </div>
            <div className="form-group">
              <div className="col-sm-12">
                <LoadingButton
                  loadingText={t('portainer.settings.backup.s3.saving_settings')}
                  isLoading={isSubmitting}
                  className={clsx('!ml-0', { 'limited-be': limitedToBE })}
                  disabled={!isValid || limitedToBE}
                  data-cy="settings-saveBackupSettingsButton"
                >
                  {t('portainer.settings.backup.s3.save_backup_settings')}
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
        notifySuccess(i18n.t('common.success'), i18n.t('portainer.settings.backup.s3.export_success'));
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
        notifySuccess(i18n.t('common.success'), i18n.t('portainer.settings.backup.s3.save_success'));
      },
    });
  }
}
