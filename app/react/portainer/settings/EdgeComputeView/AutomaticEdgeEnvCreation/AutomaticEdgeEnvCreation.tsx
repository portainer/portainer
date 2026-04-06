import { Laptop } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import { useSettings } from '../../queries';

import { AutoEnvCreationSettingsForm } from './AutoEnvCreationSettingsForm';

export function AutomaticEdgeEnvCreation() {
  const { t } = useTranslation();
  const settingsQuery = useSettings();

  if (!settingsQuery.data) {
    return null;
  }

  const settings = settingsQuery.data;

  return (
    <Widget>
      <WidgetTitle icon={Laptop} title={t('settings.edge.automatic_env_creation')} />
      <WidgetBody>
        <AutoEnvCreationSettingsForm settings={settings} />
      </WidgetBody>
    </Widget>
  );
}
