import { useMutation } from 'react-query';
import { useEffect, useState } from 'react';
import { Laptop, CloudLightning, Cloud } from 'lucide-react';

import { generateKey } from '@/react/portainer/environments/environment.service/edge';
import { EdgeScriptForm } from '@/react/edge/components/EdgeScriptForm';
import { commandsTabs } from '@/react/edge/components/EdgeScriptForm/scripts';
import { useSettings } from '@/react/portainer/settings/queries';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { TextTip } from '@@/Tip/TextTip';
import { BoxSelector } from '@@/BoxSelector';

const commands = {
  linux: [
    commandsTabs.k8sLinux,
    commandsTabs.swarmLinux,
    commandsTabs.standaloneLinux,
    commandsTabs.nomadLinux,
  ],
  win: [commandsTabs.swarmWindows, commandsTabs.standaloneWindow],
};

const asyncModeOptions = [
  {
    icon: CloudLightning,
    id: 'standard',
    label: 'Edge Agent Standard',
    value: false,
    iconType: 'badge',
  },
  {
    icon: Cloud,
    id: 'async',
    label: 'Edge Agent Async',
    value: true,
    iconType: 'badge',
  },
] as const;

export function AutomaticEdgeEnvCreation() {
  const edgeKeyMutation = useGenerateKeyMutation();
  const { mutate: generateKey, reset: resetKey } = edgeKeyMutation;
  const settingsQuery = useSettings();
  const [asyncMode, setAsyncMode] = useState(false);

  const url = settingsQuery.data?.EdgePortainerUrl;

  const settings = settingsQuery.data;
  const edgeKey = edgeKeyMutation.data;
  const edgeComputeConfigurationOK = validateConfiguration(asyncMode);

  useEffect(() => {
    if (edgeComputeConfigurationOK) {
      generateKey();
    } else {
      resetKey();
    }
  }, [generateKey, edgeComputeConfigurationOK, resetKey]);

  if (!settingsQuery.data) {
    return null;
  }

  return (
    <Widget>
      <WidgetTitle icon={Laptop} title="Automatic Edge Environment Creation" />
      <WidgetBody className="form-horizontal">
        <BoxSelector
          slim
          radioName="async-mode-selector"
          value={asyncMode}
          onChange={handleChangeAsyncMode}
          options={asyncModeOptions}
        />
        {!edgeComputeConfigurationOK && (
          <TextTip color="orange">
            In order to use this feature, please make sure that Edge Compute
            features are turned on and that you have properly configured the
            Portainer API server URL{' '}
            {asyncMode ? '' : 'and tunnel server address'}.
          </TextTip>
        )}

        {edgeKeyMutation.isLoading ? (
          <div>Generating key for {url} ... </div>
        ) : (
          edgeKey && (
            <>
              <hr />
              <EdgeScriptForm
                edgeInfo={{ key: edgeKey }}
                commands={commands}
                isNomadTokenVisible
                asyncMode={asyncMode}
              />
            </>
          )
        )}
      </WidgetBody>
    </Widget>
  );

  function handleChangeAsyncMode(asyncMode: boolean) {
    setAsyncMode(asyncMode);
  }

  function validateConfiguration(asyncMode: boolean) {
    return !!(
      settings &&
      settings.EnableEdgeComputeFeatures &&
      settings.EdgePortainerUrl &&
      (asyncMode || settings.Edge.TunnelServerAddress)
    );
  }
}

// using mutation because we want this action to run only when required
function useGenerateKeyMutation() {
  return useMutation(generateKey);
}
