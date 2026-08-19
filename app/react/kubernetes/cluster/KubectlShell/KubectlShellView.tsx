import { useState } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { baseHref } from '@/portainer/helpers/pathHelper';
import { terminalClose } from '@/portainer/services/terminal-window';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { isVersionSmaller } from '@/react/common/semver-utils';

import { Alert } from '@@/Alert';
import { Button } from '@@/buttons';
import { Terminal, LINUX_SHELL_INIT_COMMANDS } from '@@/Terminal/Terminal';
import type { ShellState } from '@@/Terminal/Terminal';

const RESIZE_LAST_UNSUPPORTED_AGENT_VERSION = '2.40.0';

export function KubectlShellView() {
  const environmentId = useEnvironmentId();
  const [shellState, setShellState] = useState<ShellState>('idle');
  const { data: agentVersion } = useEnvironment(
    environmentId,
    (env) => env.Agent.Version
  );
  const supportsResizeOverSocket =
    !!agentVersion &&
    isVersionSmaller(RESIZE_LAST_UNSUPPORTED_AGENT_VERSION, agentVersion);

  return (
    <div className="fixed bottom-0 left-0 right-0 top-0 z-[10000] bg-black text-white">
      {shellState === 'connecting' && (
        <div className="px-4 pt-2">Loading Terminal...</div>
      )}
      {shellState === 'disconnected' && (
        <div className="p-4">
          <Alert color="info" title="Console disconnected">
            <div className="mt-4 flex items-center gap-2">
              <Button
                onClick={() => window.location.reload()}
                data-cy="k8sShell-reloadButton"
              >
                Reload
              </Button>
              <Button
                onClick={() => window.close()}
                color="default"
                data-cy="k8sShell-closeButton"
              >
                Close
              </Button>
            </div>
          </Alert>
        </div>
      )}
      <Terminal
        url={buildUrl(environmentId)}
        connect
        onStateChange={onStateChange}
        initialCommands={[
          ...LINUX_SHELL_INIT_COMMANDS,

          '# Run kubectl commands inside here\n',
          '# e.g. kubectl get all\n',
          '',
        ]}
        onResize={supportsResizeOverSocket ? 'socket' : null}
      />
    </div>
  );

  function onStateChange(state: ShellState) {
    if (state === 'disconnected') {
      terminalClose();
    }
    setShellState(state);
  }

  function buildUrl(environmentId: EnvironmentId) {
    const params = {
      endpointId: environmentId,
    };

    const wsProtocol =
      window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const path = `${baseHref()}api/websocket/kubernetes-shell`;
    const base = path.startsWith('http')
      ? path.replace(/^https?:\/\//i, '')
      : window.location.host + path;

    const queryParams = Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return `${wsProtocol}${base}?${queryParams}`;
  }
}
