import { useState } from 'react';

import { useStatus } from '@/portainer/services/api/status.service';
import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';

import { EdgeKeyGeneration } from './EdgeKeyGenerationForm';
import { Scripts } from './Scripts';
import { EdgePropertiesForm } from './EdgePropertiesForm';
import { EdgeProperties } from './types';

export function AutomaticEdgeEnvCreation() {
  const versionQuery = useStatus();

  const [edgeKey, setEdgeKey] = useState('');

  const [edgeProperties, setEdgeProperties] = useState<EdgeProperties>({
    allowSelfSignedCertificates: true,
    envVars: '',
    edgeIdGenerator: '',
    os: 'linux',
    platform: 'standalone',
  });

  if (!versionQuery.data) {
    return null;
  }

  const agentVersion = versionQuery.data.Version;

  return (
    <Widget>
      <WidgetTitle
        icon="fa-laptop"
        title="Automatic Edge Environment Creation"
      />
      <WidgetBody>
        <EdgeKeyGeneration onCreate={setEdgeKey} />
        {edgeKey && (
          <>
            <hr />

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
            />
          </>
        )}
      </WidgetBody>
    </Widget>
  );
}
