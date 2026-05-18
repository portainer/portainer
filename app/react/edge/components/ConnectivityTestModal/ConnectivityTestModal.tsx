import { useState } from 'react';

import { useAgentDetails } from '@/react/portainer/environments/queries/useAgentDetails';

import { Code } from '@@/Code';
import { CopyButton } from '@@/buttons/CopyButton';
import { Modal } from '@@/modals/Modal';
import { Button } from '@@/buttons';
import { NavTabs } from '@@/NavTabs';
import { NavContainer } from '@@/NavTabs/NavContainer';
import { SwitchField } from '@@/form-components/SwitchField';

export type ConnectivityEnvironment = 'docker' | 'podman' | 'kubernetes';

const ALL_ENVIRONMENTS: ConnectivityEnvironment[] = [
  'docker',
  'podman',
  'kubernetes',
];

const ENVIRONMENT_LABELS: Record<ConnectivityEnvironment, string> = {
  docker: 'Docker',
  podman: 'Podman',
  kubernetes: 'Kubernetes',
};

interface Props {
  onDismiss: () => void;
  portainerUrl: string;
  tunnelServerAddr?: string;
  /** When provided, show only this environment. When omitted, show tabs for all environments. */
  environment?: ConnectivityEnvironment;
}

export function ConnectivityTestModal({
  onDismiss,
  portainerUrl,
  tunnelServerAddr,
  environment,
}: Props) {
  const environments = environment ? [environment] : ALL_ENVIRONMENTS;
  const [selectedTab, setSelectedTab] = useState<ConnectivityEnvironment>(
    environments[0]
  );
  const [insecurePoll, setInsecurePoll] = useState(true);
  const agentDetails = useAgentDetails();
  const agentVersion = agentDetails?.agentVersion ?? 'latest';

  const options = environments.map((env) => {
    const command = buildCommand(
      env,
      portainerUrl,
      tunnelServerAddr,
      insecurePoll,
      agentVersion
    );
    const label = ENVIRONMENT_LABELS[env];
    return {
      id: env,
      label,
      children: (
        <>
          <Code>{command}</Code>
          <div className="mt-2">
            <CopyButton
              copyText={command}
              data-cy="copy-connectivity-test-command-button"
            >
              Copy command
            </CopyButton>
          </div>
        </>
      ),
    };
  });

  return (
    <Modal onDismiss={onDismiss} aria-label="Test connectivity" size="lg">
      <Modal.Header title="Test connectivity" />
      <Modal.Body>
        <p className="mb-4">
          Run the command in the environment where the Edge Agent will be
          deployed to verify it can reach the Portainer server.
        </p>
        <div className="mb-4">
          <SwitchField
            checked={insecurePoll}
            onChange={setInsecurePoll}
            label="Allow self-signed certificates"
            labelClass="col-sm-4 col-lg-3"
            tooltip="Include EDGE_INSECURE_POLL=1 in the script. Enable this if your Portainer instance uses a self-signed or untrusted certificate."
            data-cy="connectivity-insecure-poll-switch"
          />
        </div>
        <NavContainer>
          <NavTabs
            selectedId={selectedTab}
            options={options}
            onSelect={(id: ConnectivityEnvironment) => setSelectedTab(id)}
          />
        </NavContainer>
      </Modal.Body>
      <Modal.Footer>
        <Button
          onClick={onDismiss}
          color="default"
          data-cy="close-connectivity-test-modal-button"
        >
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function buildCommand(
  environment: ConnectivityEnvironment,
  portainerUrl: string,
  tunnelServerAddr?: string,
  allowInsecurePoll?: boolean,
  agentVersion = 'latest'
): string {
  const envVars = [
    'EDGE_CONNECTIVITY_CHECK=1',
    `EDGE_CONNECTIVITY_CHECK_URL=${portainerUrl}`,
    `EDGE_INSECURE_POLL=${allowInsecurePoll ? '1' : '0'}`,
    ...(tunnelServerAddr
      ? [`EDGE_CONNECTIVITY_CHECK_TUNNEL_ADDR=${tunnelServerAddr}`]
      : []),
  ];

  const image = `portainer/agent:${agentVersion}`;

  switch (environment) {
    case 'kubernetes':
      return [
        `kubectl run portainer-connectivity-check \\`,
        `  --rm --attach --restart=Never \\`,
        `  --image=${image} \\`,
        ...envVars.map((v, i) =>
          i < envVars.length - 1 ? `  --env="${v}" \\` : `  --env="${v}"`
        ),
      ].join('\n');
    case 'podman':
      return [
        `sudo podman run --rm \\`,
        ...envVars.map((v) => `  -e ${v} \\`),
        `  docker.io/${image}`,
      ].join('\n');
    case 'docker':
    default:
      return [
        `docker run --rm \\`,
        ...envVars.map((v) => `  -e ${v} \\`),
        `  ${image}`,
      ].join('\n');
  }
}
