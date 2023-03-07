import { useMutation } from 'react-query';
import { useEffect, useState } from 'react';
import { Laptop } from 'lucide-react';

import { generateKey } from '@/react/portainer/environments/environment.service/edge';
import { EdgeScriptForm } from '@/react/edge/components/EdgeScriptForm';
import { commandsTabs } from '@/react/edge/components/EdgeScriptForm/scripts';
import { useSettings } from '@/react/portainer/settings/queries';
import EdgeAgentStandardIcon from '@/react/edge/components/edge-agent-standard.svg?c';
import EdgeAgentAsyncIcon from '@/react/edge/components/edge-agent-async.svg?c';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { TextTip } from '@@/Tip/TextTip';
import { BoxSelector } from '@@/BoxSelector';
import { FormSection } from '@@/form-components/FormSection';
import { CopyButton } from '@@/buttons';
import { Link } from '@@/Link';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

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
    icon: EdgeAgentStandardIcon,
    id: 'standard',
    label: 'Edge Agent Standard',
    value: false,
    iconType: 'badge',
  },
  {
    icon: EdgeAgentAsyncIcon,
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
  const edgeComputeConfigurationOK = validateConfiguration();

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
        {!edgeComputeConfigurationOK ? (
          <TextTip color="orange">
            In order to use this feature, please turn on Edge Compute features{' '}
            <Link to="portainer.settings.edgeCompute">here</Link> and have
            Portainer API server URL and tunnel server address properly
            configured.
          </TextTip>
        ) : (
          <>
            <BoxSelector
              slim
              radioName="async-mode-selector"
              value={asyncMode}
              onChange={handleChangeAsyncMode}
              options={asyncModeOptions}
            />

            <EdgeKeyInfo
              asyncMode={asyncMode}
              edgeKey={edgeKey}
              isLoading={edgeKeyMutation.isLoading}
              url={url}
              tunnelUrl={settings?.Edge.TunnelServerAddress}
            />
          </>
        )}
      </WidgetBody>
    </Widget>
  );

  function handleChangeAsyncMode(asyncMode: boolean) {
    setAsyncMode(asyncMode);
  }

  function validateConfiguration() {
    return !!(
      settings &&
      settings.EnableEdgeComputeFeatures &&
      settings.EdgePortainerUrl &&
      settings.Edge.TunnelServerAddress
    );
  }
}

// using mutation because we want this action to run only when required
function useGenerateKeyMutation() {
  return useMutation(generateKey);
}

function EdgeKeyInfo({
  isLoading,
  edgeKey,
  url,
  tunnelUrl,
  asyncMode,
}: {
  isLoading: boolean;
  edgeKey?: string;
  url?: string;
  tunnelUrl?: string;
  asyncMode: boolean;
}) {
  if (isLoading || !edgeKey) {
    return <div>Generating key for {url} ... </div>;
  }

  return (
    <>
      <hr />

      <FormSection title="Edge key">
        <div className="break-words">
          <code>{edgeKey}</code>
        </div>

        <CopyButton copyText={edgeKey}>Copy token</CopyButton>
      </FormSection>

      <hr />

      <EdgeScriptForm
        edgeInfo={{ key: edgeKey }}
        commands={commands}
        isNomadTokenVisible
        asyncMode={asyncMode}
        showMetaFields
      >
        <FormControl label="Portainer API server URL">
          <Input value={url} readOnly />
        </FormControl>

        {!asyncMode && (
          <FormControl label="Portainer tunnel server address">
            <Input value={tunnelUrl} readOnly />
          </FormControl>
        )}

        <TextTip color="blue">
          Portainer Server URL{' '}
          {!asyncMode ? 'and tunnel server address are' : 'is'} set{' '}
          <Link to="portainer.settings.edgeCompute">here</Link>
        </TextTip>
      </EdgeScriptForm>
    </>
  );
}
