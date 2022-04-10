import { useState } from 'react';

import { useStatus } from '@/portainer/services/api/status.service';
import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Input } from '@/portainer/components/form-components/Input';
import { FormSectionTitle } from '@/portainer/components/form-components/FormSectionTitle';
import { SwitchField } from '@/portainer/components/form-components/SwitchField';

import { EdgeKeyGeneration } from './EdgeKeyGenerationForm';
import { Scripts } from './Scripts';

export function EdgeScript() {
  const versionQuery = useStatus();

  const [edgeKey, setEdgeKey] = useState('');

  const [state, setState] = useState({
    os: 'linux',
    platform: 'standalone',
    allowSelfSignedCertificates: true,
    envVars: '',
    edgeIdScript: 'cat /proc/sys/kernel/random/uuid',
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
        {(true || edgeKey) && (
          <>
            <hr />
            <form className="form-horizontal">
              <FormSectionTitle>Edge settings</FormSectionTitle>
              <FormControl
                label="Edge ID Getter"
                tooltip="A bash script one liner that will create the edge id"
                inputId="edge-id-getter-input"
              >
                <Input
                  type="text"
                  name="edgeIdScript"
                  value={state.edgeIdScript}
                  id="edge-id-getter-input"
                  onChange={(e) =>
                    setState({ ...state, edgeIdScript: e.target.value })
                  }
                />
              </FormControl>

              <div className="form-group">
                <div className="col-sm-12">
                  <SwitchField
                    checked={state.allowSelfSignedCertificates}
                    label="Allow self-signed certificates"
                    tooltip="When allowing self-signed certificates the edge agent will ignore the domain validation when connecting to Portainer via HTTPS"
                    onChange={(checked) =>
                      setState({
                        ...state,
                        allowSelfSignedCertificates: checked,
                      })
                    }
                  />
                </div>
              </div>

              <FormControl
                label="Environment variables"
                tooltip="Comma separated list of environment variables that will be sourced from the host where the agent is deployed."
                inputId="env-vars-input"
              >
                <Input
                  type="text"
                  name="edgeIdScript"
                  value={state.envVars}
                  id="env-vars-input"
                  onChange={(e) =>
                    setState({ ...state, envVars: e.target.value })
                  }
                />
              </FormControl>
            </form>

            <Scripts
              agentVersion={agentVersion}
              edgeKey={edgeKey}
              envVars={state.envVars}
              edgeIdScript={state.edgeIdScript}
              allowSelfSignedCertificates={state.allowSelfSignedCertificates}
            />
          </>
        )}
      </WidgetBody>
    </Widget>
  );
}
