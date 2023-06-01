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
    passwordS3: settingsQuery.data.password,
    cronRule: settingsQuery.data.cronRule,
    accessKeyID: settingsQuery.data.accessKeyID,
    secretAccessKey: settingsQuery.data.secretAccessKey,
    region: settingsQuery.data.region,
    bucketName: settingsQuery.data.bucketName,
    s3CompatibleHost: settingsQuery.data.s3CompatibleHost,
    password: '',
    passwordProtect: false,
  };

  settings.scheduleAutomaticBackup = !!settings.cronRule;
  settings.passwordProtectS3 = !!settings.passwordS3;

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
