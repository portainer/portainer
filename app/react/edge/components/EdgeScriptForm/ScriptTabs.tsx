import { useEffect } from 'react';

import { useAgentDetails } from '@/react/portainer/environments/queries/useAgentDetails';

import { Code } from '@@/Code';
import { CopyButton } from '@@/buttons/CopyButton';
import { NavTabs } from '@@/NavTabs';

import { ScriptFormValues, Platform } from './types';
import { CommandTab } from './scripts';

interface Props {
  values: ScriptFormValues;
  edgeKey: string;
  edgeId?: string;
  commands: CommandTab[];
  platform?: Platform;
  onPlatformChange?(platform: Platform): void;
  hideAsyncMode?: boolean;
}

export function ScriptTabs({
  values,
  edgeKey,
  edgeId,
  commands,
  platform,
  hideAsyncMode = false,
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

  const { agentSecret, agentVersion, useEdgeAsyncMode } = agentDetails;

  const options = commands.map((c) => {
    const cmd = c.command(
      agentVersion,
      edgeKey,
      values,
      !hideAsyncMode && useEdgeAsyncMode,
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
            <CopyButton copyText={cmd}>Copy</CopyButton>
          </div>
        </>
      ),
    };
  });

  return (
    <div className="row">
      <div className="col-sm-12">
        <NavTabs
          selectedId={platform}
          options={options}
          onSelect={(id: Platform) => onPlatformChange(id)}
        />
      </div>
    </div>
  );
}
