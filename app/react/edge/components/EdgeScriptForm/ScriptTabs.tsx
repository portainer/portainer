import { useEffect } from 'react';

import { useAgentDetails } from '@/react/portainer/environments/queries/useAgentDetails';

import { Code } from '@@/Code';
import { CopyButton } from '@@/buttons/CopyButton';
import { NavTabs } from '@@/NavTabs';
import { NavContainer } from '@@/NavTabs/NavContainer';

import { ScriptFormValues, Platform } from './types';
import { CommandTab } from './scripts';

interface Props {
  values: ScriptFormValues;
  edgeKey: string;
  edgeId?: string;
  commands: CommandTab[];
  platform?: Platform;
  onPlatformChange?(platform: Platform): void;
  asyncMode?: boolean;
}

export function ScriptTabs({
  values,
  edgeKey,
  edgeId,
  commands,
  platform,
  asyncMode = false,
  onPlatformChange = () => {},
}: Props) {
  const agentDetails = useAgentDetails();

  useEffect(() => {
    if (commands.length > 0 && commands.every((p) => p.id !== platform)) {
      onPlatformChange(commands[0].id);
    }
  }, [platform, onPlatformChange, commands]);

  if (!agentDetails) {
    return null;
  }

  const { agentSecret, agentVersion } = agentDetails;

  const options = commands.map((c) => {
    const cmd = c.command(
      agentVersion,
      edgeKey,
      values,
      asyncMode,
      edgeId,
      agentSecret
    );

    return {
      id: c.id,
      label: c.label,
      children: (
        <>
          <Code>{cmd}</Code>
          <div className="mt-2">
            <CopyButton copyText={cmd} data-cy="copy-edge-script-button">
              Copy
            </CopyButton>
          </div>
        </>
      ),
    };
  });

  return (
    <NavContainer>
      <NavTabs
        selectedId={platform}
        options={options}
        onSelect={(id: Platform) => onPlatformChange(id)}
      />
    </NavContainer>
  );
}
