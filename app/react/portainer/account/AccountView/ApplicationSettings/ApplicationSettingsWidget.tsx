import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import { ApplicationSettingsForm } from './ApplicationSettingsForm';

export function ApplicationSettingsWidget() {
  const { t } = useTranslation();

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetTitle icon={Settings} title={t('portainer_account.application_settings')} />
          <WidgetBody>
            <ApplicationSettingsForm />
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
