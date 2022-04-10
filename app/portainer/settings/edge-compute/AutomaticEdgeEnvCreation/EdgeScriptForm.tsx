import { useState } from 'react';

import { useStatus } from '@/portainer/services/api/status.service';
import { r2a } from '@/react-tools/react2angular';

import { EdgePropertiesForm } from './EdgePropertiesForm';
import { Scripts } from './Scripts';
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
    platform: 'standalone',
  });

  const versionQuery = useStatus((status) => status.Version);

  if (!versionQuery.data) {
    return null;
  }

  const agentVersion = versionQuery.data;

  return (
    <>
      <EdgePropertiesForm
        setFieldValue={(key, value) =>
          setEdgeProperties({ ...edgeProperties, [key]: value })
        }
        values={edgeProperties}
      />

      <Scripts
        values={edgeProperties}
        agentVersion={agentVersion}
        edgeKey={edgeKey}
        onPlatformChange={(platform) =>
          setEdgeProperties({ ...edgeProperties, platform })
        }
        edgeId={edgeId}
      />
    </>
  );
}

export const EdgeScriptFormAngular = r2a(EdgeScriptForm, ['edgeKey', 'edgeId']);
