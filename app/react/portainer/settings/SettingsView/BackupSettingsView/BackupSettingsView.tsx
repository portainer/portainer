import { Download } from 'lucide-react';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import { BackupForm } from './BackupForm';
import { useBackupS3Settings } from './queries';
import { FormValues } from './types';

export function BackupSettingsView() {
  const settingsQuery = useBackupS3Settings();

  if (!settingsQuery.data) {
    return null;
  }

  const settings: FormValues = {
    PasswordS3: settingsQuery.data.Password,
    CronRule: settingsQuery.data.CronRule,
    AccessKeyID: settingsQuery.data.AccessKeyID,
    SecretAccessKey: settingsQuery.data.SecretAccessKey,
    Region: settingsQuery.data.Region,
    BucketName: settingsQuery.data.BucketName,
    S3CompatibleHost: settingsQuery.data.S3CompatibleHost,
    Password: '',
    PasswordProtect: false,
  };

  settings.ScheduleAutomaticBackup = !!settings.CronRule;
  settings.PasswordProtectS3 = !!settings.PasswordS3;

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
