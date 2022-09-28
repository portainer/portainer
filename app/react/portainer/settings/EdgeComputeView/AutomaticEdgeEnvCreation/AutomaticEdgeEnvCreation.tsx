import { useMutation } from 'react-query';
import { useEffect } from 'react';

import { generateKey } from '@/react/portainer/environments/environment.service/edge';
import { EdgeScriptForm } from '@/react/edge/components/EdgeScriptForm';
import { commandsTabs } from '@/react/edge/components/EdgeScriptForm/scripts';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import { useSettings } from '../../queries';

import { AutoEnvCreationSettingsForm } from './AutoEnvCreationSettingsForm';

const commands = {
  linux: [
    commandsTabs.k8sLinux,
    commandsTabs.swarmLinux,
    commandsTabs.standaloneLinux,
    commandsTabs.nomadLinux,
  ],
  win: [commandsTabs.swarmWindows, commandsTabs.standaloneWindow],
};

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
        icon="svg-laptop"
        title="Automatic Edge Environment Creation"
      />
      <WidgetBody>
        <AutoEnvCreationSettingsForm settings={settingsQuery.data} />

        {edgeKeyMutation.isLoading ? (
          <div>Generating key for {url} ... </div>
        ) : (
          edgeKey && (
            <EdgeScriptForm
              edgeInfo={{ key: edgeKey }}
              commands={commands}
              isNomadTokenVisible
            />
          )
        )}
      </WidgetBody>
    </Widget>
  );
}

// using mutation because we want this action to run only when required
function useGenerateKeyMutation() {
  return useMutation(generateKey);
}
