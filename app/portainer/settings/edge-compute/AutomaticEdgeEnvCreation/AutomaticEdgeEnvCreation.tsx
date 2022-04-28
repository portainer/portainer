import { useMutation } from 'react-query';
import { useEffect } from 'react';

import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { EdgeScriptForm } from '@/edge/components/EdgeScriptForm';
import { generateKey } from '@/portainer/environments/environment.service/edge';

import { useSettings } from '../../settings.service';

import { AutoEnvCreationSettingsForm } from './AutoEnvCreationSettingsForm';

export function AutomaticEdgeEnvCreation() {
  const edgeKeyMutation = useGenerateKeyMutation();
  const { mutate: generateKey } = edgeKeyMutation;
  const settingsQuery = useSettings();

  const url = settingsQuery.data?.EdgePortainerUrl;

  useEffect(() => {
    if (url) {
      generateKey();
    }
  }, [generateKey, url]);

  if (!settingsQuery.data) {
    return null;
  }

  const edgeKey = edgeKeyMutation.data;

  return (
    <Widget>
      <WidgetTitle
        icon="fa-laptop"
        title="Automatic Edge Environment Creation"
      />
      <WidgetBody>
        <AutoEnvCreationSettingsForm settings={settingsQuery.data} />

        {edgeKeyMutation.isLoading ? (
          <div>Generating key for {url} ... </div>
        ) : (
          edgeKey && <EdgeScriptForm edgeKey={edgeKey} />
        )}
      </WidgetBody>
    </Widget>
  );
}

// using mutation because we want this action to run only when required
function useGenerateKeyMutation() {
  return useMutation(generateKey);
}
