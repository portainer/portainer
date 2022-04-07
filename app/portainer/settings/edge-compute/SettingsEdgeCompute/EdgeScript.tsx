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

export function EdgeScript() {
  const versionQuery = useStatus();

  const [edgeKey, setEdgeKey] = useState('');

  const [state] = useState({
    allowSelfSignedCertificates: true,
    envVars: '',
  });

  if (!versionQuery.data) {
    return null;
  }

  const agentShortVersion = getAgentShortVersion(versionQuery.data.Version);

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
            <div className="row">
              <div className="col-sm-12">
                <NavTabs
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
                        <LinuxTab
                          agentShortVersion={agentShortVersion}
                          edgeKey={edgeKey}
                          edgeId="<EDGE_ID>"
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
                        <LinuxTab
                          agentShortVersion={agentShortVersion}
                          edgeKey={edgeKey}
                          edgeId="<EDGE_ID>"
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
                        <LinuxTab
                          agentShortVersion={agentShortVersion}
                          edgeKey={edgeKey}
                          edgeId="<EDGE_ID>"
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
                        <LinuxTab
                          agentShortVersion={agentShortVersion}
                          edgeKey={edgeKey}
                          edgeId="<EDGE_ID>"
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
                        <LinuxTab
                          agentShortVersion={agentShortVersion}
                          edgeKey={edgeKey}
                          edgeId="<EDGE_ID>"
                          allowSelfSignedCertificates={
                            state.allowSelfSignedCertificates
                          }
                          envVars={state.envVars}
                        />
                      ),
                    },
                    {
                      id: 'win-kubernetes',
                      label: 'Kubernetes',
                      children: (
                        <LinuxTab
                          agentShortVersion={agentShortVersion}
                          edgeKey={edgeKey}
                          edgeId="<EDGE_ID>"
                          allowSelfSignedCertificates={
                            state.allowSelfSignedCertificates
                          }
                          envVars={state.envVars}
                        />
                      ),
                    },
                  ]}
                  selectedId="docker-standalone"
                />
              </div>
            </div>
          </>
        )}
      </WidgetBody>
    </Widget>
  );
}

interface LinuxTabProps {
  allowSelfSignedCertificates: boolean;
  edgeKey: string;
  agentShortVersion: string;
  envVars: string;
  edgeId: string;
}

function LinuxTab({
  allowSelfSignedCertificates,
  edgeKey,
  edgeId,
  agentShortVersion,
  envVars,
}: LinuxTabProps) {
  const code = linuxCode(
    agentShortVersion,

    allowSelfSignedCertificates,
    envVars,
    edgeKey,
    edgeId
  );

  return <Code showCopyButton>{code}</Code>;
}

function linuxCode(
  agentShortVersion: string,
  allowSelfSignedCerts: boolean,
  envVars: string,
  edgeKey: string,
  edgeId: string
) {
  const selfSignedCertsValue = allowSelfSignedCerts ? '1' : '';

  return `curl https://downloads.portainer.io/portainer-ee${agentShortVersion}-edge-agent-nomad-setup.sh | 
  bash -s -- "${edgeId}" "${edgeKey}" "${selfSignedCertsValue}" "${envVars}"`;
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
        <Form>
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
            <LoadingButton
              loadingText="generating..."
              isLoading={mutation.isLoading}
              disabled={!isValid}
            >
              Generate Key
            </LoadingButton>
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
