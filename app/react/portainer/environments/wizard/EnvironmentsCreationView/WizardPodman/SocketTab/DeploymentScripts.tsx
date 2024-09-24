import { useState } from 'react';

import { CopyButton } from '@@/buttons/CopyButton';
import { Code } from '@@/Code';
import { NavTabs } from '@@/NavTabs';
import { NavContainer } from '@@/NavTabs/NavContainer';
import { TextTip } from '@@/Tip/TextTip';

const deployments = [
  {
    id: 'linux',
    label: 'Linux (CentOS / RHEL)',
    command: `sudo systemctl enable --now podman.socket`,
  },
];

export function DeploymentScripts() {
  const [deployType, setDeployType] = useState(deployments[0].id);

  const options = deployments.map((c) => ({
    id: c.id,
    label: c.label,
    children: <DeployCode code={c.command} />,
  }));

  return (
    <NavContainer>
      <NavTabs
        options={options}
        onSelect={(id: string) => setDeployType(id)}
        selectedId={deployType}
      />
    </NavContainer>
  );
}

interface DeployCodeProps {
  code: string;
}

function DeployCode({ code }: DeployCodeProps) {
  return (
    <>
      <TextTip color="blue" className="mb-1">
        <p className="mb-0">
          When using the socket, ensure that you have started the Portainer
          container with the following Podman flag:
        </p>
        <code className="mb-2">
          {`-v "/run/podman/podman.sock:/run/podman/podman.sock"`}
        </code>
        <p>
          To use the socket, ensure that you have started the Podman rootful
          socket:
        </p>
      </TextTip>

      <Code>{code}</Code>
      <div className="mt-2">
        <CopyButton copyText={code} data-cy="copy-deployment-command">
          Copy command
        </CopyButton>
      </div>
    </>
  );
}
