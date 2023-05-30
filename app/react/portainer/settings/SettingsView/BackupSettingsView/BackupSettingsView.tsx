import { Download } from 'lucide-react';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import { BackupForm } from './BackupForm';
import { useBackupS3Settings } from './useBackupSettings';
import { backupFormType } from './backup-options';
import { FormValues } from './types';

export function BackupSettingsView() {
  const settingsQuery = useBackupS3Settings();

  if (!settingsQuery.data) {
    return null;
  }

  const settings: FormValues = {
    Password: settingsQuery.data.Password,
    PasswordProtect: false,
    ScheduleAutomaticBackup: true,
    CronRule: settingsQuery.data.CronRule,
    AccessKeyId: settingsQuery.data.AccessKeyId,
    SecretAccessKey: settingsQuery.data.SecretAccessKey,
    Region: settingsQuery.data.Region,
    BucketName: settingsQuery.data.BucketName,
    S3CompatibleHost: settingsQuery.data.S3CompatibleHost,
    BackupFormType: backupFormType.File,
  };

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetTitle icon={Download} title="Backup up Portainer" />
          <WidgetBody>
            <BackupForm settings={settings} />
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
