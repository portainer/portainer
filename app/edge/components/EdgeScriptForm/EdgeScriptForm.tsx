import { useState } from 'react';

import { r2a } from '@/react-tools/react2angular';

import { EdgePropertiesForm } from './EdgePropertiesForm';
import { ScriptTabs } from './ScriptTabs';
import { EdgeProperties } from './types';
import { commandsTabs } from './scripts';

interface Props {
  edgeKey: string;
  edgeId?: string;
}

const linuxCommands = [
  commandsTabs.k8sLinux,
  commandsTabs.swarmLinux,
  commandsTabs.standaloneLinux,
  commandsTabs.nomadLinux,
];

const windowsCommands = [
  commandsTabs.swarmWindows,
  commandsTabs.standaloneWindow,
];

export function EdgeScriptForm({ edgeKey, edgeId }: Props) {
  const [edgeProperties, setEdgeProperties] = useState<EdgeProperties>({
    allowSelfSignedCertificates: true,
    envVars: '',
    edgeIdGenerator: '',
    os: 'linux',
    platform: 'k8s',
  });

  const commands =
    edgeProperties.os === 'linux' ? linuxCommands : windowsCommands;

  return (
    <>
      <EdgePropertiesForm
        setFieldValue={handleChange}
        values={edgeProperties}
        hideIdGetter={edgeId !== undefined}
      />

      <ScriptTabs
        commands={commands}
        values={edgeProperties}
        edgeKey={edgeKey}
        onPlatformChange={(value) => handleChange('platform', value)}
        platform={edgeProperties.platform}
        edgeId={edgeId}
      />
    </>
  );

  function handleChange<T>(key: string, value: T) {
    setEdgeProperties((props) => ({ ...props, [key]: value }));
  }
}

export const EdgeScriptFormAngular = r2a(EdgeScriptForm, ['edgeKey', 'edgeId']);
