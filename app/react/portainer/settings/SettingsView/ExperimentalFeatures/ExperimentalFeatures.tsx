import { FlaskConical } from 'lucide-react';

import { useExperimentalSettings } from '@/react/portainer/settings/queries';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import { ExperimentalFeaturesSettingsForm } from './ExperimentalFeaturesForm';

export function ExperimentalFeatures() {
  const settingsQuery = useExperimentalSettings();

  if (!settingsQuery.data) {
    return null;
  }

  const settings = settingsQuery.data;

  return (
    <Widget>
      <WidgetTitle icon={FlaskConical} title="Experimental features" />
      <WidgetBody>
        <ExperimentalFeaturesSettingsForm
          settings={settings.experimentalFeatures}
        />
      </WidgetBody>
    </Widget>
  );
}
