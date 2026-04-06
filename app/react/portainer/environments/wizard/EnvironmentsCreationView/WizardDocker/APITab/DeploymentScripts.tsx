import { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { CopyButton } from '@@/buttons/CopyButton';
import { Code } from '@@/Code';
import { NavTabs } from '@@/NavTabs';
import { NavContainer } from '@@/NavTabs/NavContainer';
import { TextTip } from '@@/Tip/TextTip';

export function DeploymentScripts() {
  const { t } = useTranslation();

  const deployments = [
    {
      id: 'linux',
      label: t('wizard_docker_scripts.linux'),
      command: `-v "/var/run/docker.sock:/var/run/docker.sock"`,
    },
    {
      id: 'win',
      label: t('wizard_docker_scripts.windows'),
      command: '-v \\.\\pipe\\docker_engine:\\.\\pipe\\docker_engine',
    },
  ];

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
  const { t } = useTranslation();

  return (
    <>
      <TextTip color="blue" className="mb-1">
        {t('wizard_docker_scripts.socket_flag_notice')}
      </TextTip>

      <Code>{code}</Code>
      <div className="mt-2">
        <CopyButton copyText={code} data-cy="copy-deployment-command">
          {t('wizard_env.copy_command')}
        </CopyButton>
      </div>
    </>
  );
}
