import { useState } from 'react';

import { CopyButton } from '@@/buttons/CopyButton';
import { Code } from '@@/Code';
import { NavTabs } from '@@/NavTabs';
import { NavContainer } from '@@/NavTabs/NavContainer';
import { TextTip } from '@@/Tip/TextTip';

const deployments = [
  {
    id: 'linux',
    label: 'Linux',
    command: `-v "/var/run/docker.sock:/var/run/docker.sock"`,
  },
  {
    id: 'win',
    label: 'Windows',
    command: '-v \\.\\pipe\\docker_engine:\\.\\pipe\\docker_engine',
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
        When using the socket, ensure that you have started the Portainer
        container with the following Docker flag:
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
