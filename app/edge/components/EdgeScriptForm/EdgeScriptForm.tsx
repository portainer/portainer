import { useState } from 'react';

import { useStatus } from '@/portainer/services/api/status.service';
import { r2a } from '@/react-tools/react2angular';
import { useSettings } from '@/portainer/settings/settings.service';

import { EdgePropertiesForm } from './EdgePropertiesForm';
import { ScriptTabs } from './ScriptTabs';
import { EdgeProperties } from './types';

interface Props {
  edgeKey: string;
  edgeId?: string;
}

export function EdgeScriptForm({ edgeKey, edgeId }: Props) {
  const [edgeProperties, setEdgeProperties] = useState<EdgeProperties>({
    allowSelfSignedCertificates: true,
    envVars: '',
    edgeIdGenerator: '',
    os: 'linux',
    platform: 'k8s',
  });

  const settingsQuery = useSettings((settings) => settings.AgentSecret);

  const versionQuery = useStatus((status) => status.Version);

  if (!versionQuery.data) {
    return null;
  }

  const agentVersion = versionQuery.data;
  const agentSecret = settingsQuery.data;

  return (
    <>
      <EdgePropertiesForm
        setFieldValue={(key, value) =>
          setEdgeProperties({ ...edgeProperties, [key]: value })
        }
        values={edgeProperties}
        hideIdGetter={edgeId !== undefined}
      />

      <ScriptTabs
        values={edgeProperties}
        agentVersion={agentVersion}
        edgeKey={edgeKey}
        onPlatformChange={(platform) =>
          setEdgeProperties({ ...edgeProperties, platform })
        }
        edgeId={edgeId}
        agentSecret={agentSecret}
      />
    </>
  );
}

export const EdgeScriptFormAngular = r2a(EdgeScriptForm, ['edgeKey', 'edgeId']);
