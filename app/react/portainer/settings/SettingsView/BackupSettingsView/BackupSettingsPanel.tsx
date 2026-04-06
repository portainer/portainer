import { Download } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { FormSection } from '@@/form-components/FormSection';
import { BoxSelector } from '@@/BoxSelector';

import { BackupFormType, options } from './backup-options';
import { BackupFileForm } from './BackupFileForm';
import { BackupS3Form } from './BackupS3Form';

export function BackupSettingsPanel() {
  const { t } = useTranslation();
  const [backupType, setBackupType] = useState(options[0].value);

  return (
    <Widget>
      <WidgetTitle icon={Download} title={t('settings.backup_title')} />
      <WidgetBody>
        <div className="form-horizontal">
          <FormSection title={t('settings.backup_config')}>
            <div className="form-group col-sm-12 text-muted small">
              {t('settings.backup_desc')}
            </div>
            <BoxSelector
              slim
              options={options}
              value={backupType}
              onChange={(v) => setBackupType(v)}
              radioName="backup-type"
            />

            {backupType === BackupFormType.S3 ? (
              <BackupS3Form />
            ) : (
              <BackupFileForm />
            )}
          </FormSection>
        </div>
      </WidgetBody>
    </Widget>
  );
}
