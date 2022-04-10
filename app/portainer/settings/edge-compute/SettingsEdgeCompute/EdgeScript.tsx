import { useState } from 'react';
import { Field, Form, Formik } from 'formik';
import * as yup from 'yup';
import { useMutation } from 'react-query';

import { Code } from '@/portainer/components/Code';
import { NavTabs } from '@/portainer/components/NavTabs/NavTabs';
import { useStatus } from '@/portainer/services/api/status.service';
import { getAgentShortVersion } from '@/portainer/views/endpoints/helpers';
import { Widget, WidgetBody, WidgetTitle } from '@/portainer/components/widget';
import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Input } from '@/portainer/components/form-components/Input';
import { LoadingButton } from '@/portainer/components/Button/LoadingButton';
import { FormSectionTitle } from '@/portainer/components/form-components/FormSectionTitle';
import { generateKey } from '@/portainer/environments/environment.service/edge';
import { baseHref } from '@/portainer/helpers/pathHelper';
import { useLocalStorage } from '@/portainer/hooks/useLocalStorage';
import { SwitchField } from '@/portainer/components/form-components/SwitchField';

export function EdgeScript() {
  const versionQuery = useStatus();

  const [edgeKey, setEdgeKey] = useState('');

  const [state, setState] = useState({
    selectedScriptId: 'docker-standalone',
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

            <FormSectionTitle>Edge Script</FormSectionTitle>
            <div className="row">
              <div className="col-sm-12">
                <NavTabs
                  selectedId={state.selectedScriptId}
                  onSelect={(id: string) =>
                    setState({ ...state, selectedScriptId: id })
                  }
                  options={[
                    {
                      id: 'linux',
                      label: (
                        <>
                          <i
                            className="fab fa-linux space-right"
                            aria-hidden="true"
                          />
                          Linux
                        </>
                      ),
                    },
                    {
                      id: 'docker-standalone',
                      label: 'Docker standalone',
                      children: (
                        <CodeTab
                          os="linux"
                          platform="standalone"
                          agentVersion={agentVersion}
                          edgeKey={edgeKey}
                          edgeIdScript={state.edgeIdScript}
                          allowSelfSignedCertificates={
                            state.allowSelfSignedCertificates
                          }
                          envVars={state.envVars}
                        />
                      ),
                    },
                    {
                      id: 'docker-swarm',
                      label: 'Docker Swarm',
                      children: (
                        <CodeTab
                          os="linux"
                          platform="swarm"
                          agentVersion={agentVersion}
                          edgeKey={edgeKey}
                          edgeIdScript={state.edgeIdScript}
                          allowSelfSignedCertificates={
                            state.allowSelfSignedCertificates
                          }
                          envVars={state.envVars}
                        />
                      ),
                    },
                    {
                      id: 'kubernetes',
                      label: 'Kubernetes',
                      children: (
                        <CodeTab
                          os="linux"
                          platform="k8s"
                          agentVersion={agentVersion}
                          edgeKey={edgeKey}
                          edgeIdScript={state.edgeIdScript}
                          allowSelfSignedCertificates={
                            state.allowSelfSignedCertificates
                          }
                          envVars={state.envVars}
                        />
                      ),
                    },
                    {
                      id: 'windows',
                      label: (
                        <>
                          <i
                            className="fab fa-windows space-right"
                            aria-hidden="true"
                          />
                          Windows
                        </>
                      ),
                    },
                    {
                      id: 'win-docker-standalone',
                      label: 'Docker standalone',
                      children: (
                        <CodeTab
                          platform="standalone"
                          os="win"
                          agentVersion={agentVersion}
                          edgeKey={edgeKey}
                          edgeIdScript={state.edgeIdScript}
                          allowSelfSignedCertificates={
                            state.allowSelfSignedCertificates
                          }
                          envVars={state.envVars}
                        />
                      ),
                    },
                    {
                      id: 'win-docker-swarm',
                      label: 'Docker Swarm',
                      children: (
                        <CodeTab
                          os="win"
                          platform="swarm"
                          agentVersion={agentVersion}
                          edgeKey={edgeKey}
                          edgeIdScript={state.edgeIdScript}
                          allowSelfSignedCertificates={
                            state.allowSelfSignedCertificates
                          }
                          envVars={state.envVars}
                        />
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </>
        )}
      </WidgetBody>
    </Widget>
  );
}
type Platform = 'standalone' | 'swarm' | 'k8s';
type OS = 'win' | 'linux';

interface LinuxTabProps {
  allowSelfSignedCertificates: boolean;
  edgeKey: string;
  agentVersion: string;
  envVars: string;
  edgeIdScript: string;
  platform: Platform;
  os: OS;
}

const commands: Record<
  Platform,
  Partial<
    Record<
      OS,
      (
        agentVersion: string,
        edgeIdScript: string,
        edgeKey: string,
        allowSelfSignedCerts: boolean,
        envVars: string
      ) => string
    >
  >
> = {
  standalone: {
    linux: buildLinuxStandaloneCommand,
    win: buildWindowsStandaloneCommand,
  },
  swarm: {
    linux: buildLinuxSwarmCommand,
    win: buildWindowsSwarmCommand,
  },
  k8s: {
    linux: buildKubernetesCommand,
  },
};

function CodeTab({
  platform,
  os,
  allowSelfSignedCertificates,
  edgeKey,
  edgeIdScript,
  agentVersion,
  envVars,
}: LinuxTabProps) {
  if (!commands[platform]) {
    return null;
  }

  const platformCommands = commands[platform];

  const commandGenerator = platformCommands[os];
  if (!commandGenerator) {
    return null;
  }

  const code = commandGenerator(
    agentVersion,
    edgeIdScript,
    edgeKey,
    allowSelfSignedCertificates,
    envVars
  );

  return <Code showCopyButton>{code}</Code>;
}

interface FormValues {
  url: string;
}

interface Props {
  onCreate: (edgeKey: string) => void;
}

function EdgeKeyGeneration({ onCreate }: Props) {
  const validation = yup.object({
    url: yup
      .string()
      .url('URL should be a valid URI')
      .required('URL is required'),
  });

  const [defaultUrl, setDefaultUrl] = useLocalStorage(
    'edge-portainer-url',
    buildDefaultUrl()
  );

  const mutation = useGenerateKeyMutation();

  return (
    <Formik<FormValues>
      initialValues={{ url: defaultUrl }}
      onSubmit={handleSubmit}
      validationSchema={validation}
    >
      {({ errors, isValid, touched }) => (
        <Form className="form-horizontal">
          <FormSectionTitle>Edge Key Generation</FormSectionTitle>

          <FormControl
            label="Portainer URL"
            tooltip="URL of the Portainer instance that the agent will use to initiate the communications."
            inputId="url-input"
            errors={touched.url && errors.url}
          >
            <Field as={Input} id="url-input" name="url" />
          </FormControl>

          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                loadingText="generating..."
                isLoading={mutation.isLoading}
                disabled={!isValid}
              >
                Generate Key
              </LoadingButton>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );

  function handleSubmit(values: FormValues) {
    setDefaultUrl(values.url);

    mutation.mutate(values.url, {
      onSuccess(data) {
        onCreate(data.edgeKey);
      },
    });
  }
}

function useGenerateKeyMutation() {
  return useMutation((url: string) => generateKey(url), {
    meta: {
      error: {
        title: 'Failure',
        message: 'Failed generating key',
      },
    },
  });
}

function buildDefaultUrl() {
  const baseHREF = baseHref();
  return window.location.origin + (baseHREF !== '/' ? baseHREF : '');
}

function buildEnvironmentSubCommand(envVars: string) {
  if (!envVars) {
    return [];
  }

  return envVars
    .split(',')
    .filter((s) => s.length > 0)
    .map((s) => `-e ${s} \\`);
}

function buildLinuxStandaloneCommand(
  agentVersion: string,
  edgeIdScript: string,
  edgeKey: string,
  allowSelfSignedCerts: boolean,
  envVars: string
) {
  const env = buildEnvironmentSubCommand(envVars);

  return `
EDGE_ID=$(${edgeIdScript})

docker run -d \\
-v /var/run/docker.sock:/var/run/docker.sock \\
-v /var/lib/docker/volumes:/var/lib/docker/volumes \\
-v /:/host \\
-v portainer_agent_data:/data \\
--restart always \\
-e EDGE=1 \\
-e EDGE_ID=$EDGE_ID \\
-e EDGE_KEY=${edgeKey} \\
-e CAP_HOST_MANAGEMENT=1 \\
-e EDGE_INSECURE_POLL=${allowSelfSignedCerts ? 1 : 0} \\
${env.join('\n')}
--name portainer_edge_agent \\
portainer/agent:${agentVersion}
  `;
}

function buildWindowsStandaloneCommand(
  agentVersion: string,
  edgeIdScript: string,
  edgeKey: string,
  allowSelfSignedCerts: boolean,
  envVars: string
) {
  const env = buildEnvironmentSubCommand(envVars);

  return [
    `EDGE_ID=$(${edgeIdScript})`,
    '',
    'docker run -d \\',
    '--mount type=npipe,src=\\\\.\\pipe\\docker_engine,dst=\\\\.\\pipe\\docker_engine \\',
    '--mount type=bind,src=C:\\ProgramData\\docker\\volumes,dst=C:\\ProgramData\\docker\\volumes \\',
    '--mount type=volume,src=portainer_agent_data,dst=C:\\data \\',
    '--restart always \\',
    '-e EDGE=1 \\',
    `-e EDGE_ID=EDGE_ID \\`,
    `-e EDGE_KEY=${edgeKey} \\`,
    '-e CAP_HOST_MANAGEMENT=1 \\',
    `-e EDGE_INSECURE_POLL=${allowSelfSignedCerts ? 1 : 0} \\`,
    ...env,
    '--name portainer_edge_agent \\',
    `portainer/agent:${agentVersion}`,
  ].join('\r\n');
}

function buildLinuxSwarmCommand(
  agentVersion: string,
  edgeIdScript: string,
  edgeKey: string,
  allowSelfSignedCerts: boolean,
  envVars: string
) {
  const env = buildEnvironmentSubCommand(envVars);

  return [
    `EDGE_ID=$(${edgeIdScript})`,
    '',
    'docker network create \\',
    '--driver overlay \\',
    'portainer_agent_network;',
    '',
    'docker service create \\',
    '--name portainer_edge_agent \\',
    '--network portainer_agent_network \\',
    '-e AGENT_CLUSTER_ADDR=tasks.portainer_edge_agent \\',
    '-e EDGE=1 \\',
    `-e EDGE_ID=EDGE_ID \\`,
    `-e EDGE_KEY=${edgeKey} \\`,
    '-e CAP_HOST_MANAGEMENT=1 \\',
    `-e EDGE_INSECURE_POLL=${allowSelfSignedCerts ? 1 : 0} \\`,
    ...env,
    '--mode global \\',
    "--constraint 'node.platform.os == linux' \\",
    '--mount type=bind,src=//var/run/docker.sock,dst=/var/run/docker.sock \\',
    '--mount type=bind,src=//var/lib/docker/volumes,dst=/var/lib/docker/volumes \\',
    '--mount type=bind,src=//,dst=/host \\',
    '--mount type=volume,src=portainer_agent_data,dst=/data \\',
    `portainer/agent:${agentVersion}`,
  ].join('\r\n');
}

function buildWindowsSwarmCommand(
  agentVersion: string,
  edgeIdScript: string,
  edgeKey: string,
  allowSelfSignedCerts: boolean,
  envVars: string
) {
  const env = buildEnvironmentSubCommand(envVars);

  return [
    'docker network create \\',
    '--driver overlay \\',
    'portainer_agent_network;',
    '',

    'docker service create \\',
    '--name portainer_edge_agent \\',
    '--network portainer_agent_network \\',
    '-e AGENT_CLUSTER_ADDR=tasks.portainer_edge_agent \\',
    '-e EDGE=1 \\',
    `-e EDGE_ID=EDGE_ID \\`,
    `-e EDGE_KEY=${edgeKey} \\`,
    '-e CAP_HOST_MANAGEMENT=1 \\',
    `-e EDGE_INSECURE_POLL=${allowSelfSignedCerts ? 1 : 0} \\`,
    ...env,
    '--mode global \\',
    "--constraint 'node.platform.os == windows' \\",
    '--mount type=npipe,src=\\\\.\\pipe\\docker_engine,dst=\\\\.\\pipe\\docker_engine \\',
    '--mount type=bind,src=C:\\ProgramData\\docker\\volumes,dst=C:\\ProgramData\\docker\\volumes \\',
    '--mount type=volume,src=portainer_agent_data,dst=C:\\data \\',
    `portainer/agent:${agentVersion}`,
  ].join('\r\n');
}

function buildKubernetesCommand(
  agentVersion: string,
  edgeIdScript: string,
  edgeKey: string,
  allowSelfSignedCerts: boolean
) {
  const agentShortVersion = getAgentShortVersion(agentVersion);

  return `
EDGE_ID=$(${edgeIdScript})
  
curl https://downloads.portainer.io/portainer-ee${agentShortVersion}-edge-agent-setup.sh | 
  bash -s -- $EDGE_ID ${edgeKey} ${allowSelfSignedCerts ? '1' : '0'}`;
}
