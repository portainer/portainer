import { Download } from 'lucide-react';
import { useState } from 'react';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { FormSection } from '@@/form-components/FormSection';
import { BoxSelector } from '@@/BoxSelector';

import { BackupFormType, options } from './backup-options';
import { BackupFormFile } from './BackupFormFile';
import { BackupFormS3 } from './BackupFormS3';

export function BackupSettingsView() {
  const [backupType, setBackupType] = useState(options[0].value);

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetTitle icon={Download} title="Backup up Portainer" />
          <WidgetBody>
            <div className="form-horizontal">
              <FormSection title="Backup configuration">
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

                {backupType === BackupFormType.S3 ? (
                  <BackupFormS3 />
                ) : (
                  <BackupFormFile />
                )}
              </FormSection>
            </div>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
