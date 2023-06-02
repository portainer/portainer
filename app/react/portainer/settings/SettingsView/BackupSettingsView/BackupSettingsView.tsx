import { Download } from 'lucide-react';
import { useState } from 'react';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { FormSection } from '@@/form-components/FormSection';
import { BoxSelector } from '@@/BoxSelector';

import { useBackupS3Settings } from './queries';
import { backupFormType, options } from './backup-options';
import { BackupFormFile } from './BackupFormFile';
import { BackupFormS3 } from './BackupFormS3';
import { BackupS3Settings, BackupFileSettings } from './types';

export function BackupSettingsView() {
  const [backupType, setBackupType] = useState(options[0].value);

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
  };

  backupS3Settings.scheduleAutomaticBackup = !!backupS3Settings.cronRule;
  backupS3Settings.passwordProtectS3 = !!backupS3Settings.passwordS3;

  const backupFileSettings: BackupFileSettings = {
    password: '',
    passwordProtect: false,
  };

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetTitle icon={Download} title="Backup up Portainer" />
          <WidgetBody>
            <div className="form-horizontal">
              <FormSection title="Backup configuration" />
              <div className="form-group col-sm-12 text-muted small">
                This will back up your Portainer server configuration and does
                not include containers.
              </div>
              <BoxSelector
                slim
                options={options}
                value={backupType}
                onChange={(v) => setBackupType(v)}
                radioName="backup-type"
              />

              {backupType === backupFormType.S3 ? (
                <BackupFormS3 settings={backupS3Settings} />
              ) : (
                <BackupFormFile settings={backupFileSettings} />
              )}
            </div>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
