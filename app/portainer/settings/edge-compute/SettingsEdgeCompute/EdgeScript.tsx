import { useState } from 'react';

import { useStatus } from '@/portainer/services/api/status.service';
import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';

import { EdgeKeyGeneration } from './EdgeKeyGenerationForm';
import { Scripts } from './Scripts';
import { EdgePropertiesForm } from './EdgePropertiesForm';

export function EdgeScript() {
  const versionQuery = useStatus();

  const [edgeKey, setEdgeKey] = useState('');

  const [state, setState] = useState({
    allowSelfSignedCertificates: true,
    envVars: '',
    edgeIdGenerator: '',
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
                setState({ ...state, [key]: value })
              }
              values={state}
            />

            <Scripts
              agentVersion={agentVersion}
              edgeKey={edgeKey}
              envVars={state.envVars}
              edgeIdScript={state.edgeIdGenerator}
              allowSelfSignedCertificates={state.allowSelfSignedCertificates}
            />
          </>
        )}
      </WidgetBody>
    </Widget>
  );
}
