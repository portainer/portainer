import { useState } from 'react';
import { useCurrentStateAndParams } from '@uirouter/react';
import { Terminal as TerminalIcon } from 'lucide-react';

import { baseHref } from '@/portainer/helpers/pathHelper';
import { TerminalTooltip } from '@/react/components/TerminalTooltip';

import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody } from '@@/Widget';
import { Icon } from '@@/Icon';
import { Button } from '@@/buttons';
import { Input } from '@@/form-components/Input';
import {
  Terminal,
  isLinuxTerminalCommand,
  LINUX_SHELL_INIT_COMMANDS,
} from '@@/Terminal/Terminal';
import type { ShellState } from '@@/Terminal/Terminal';

export function ConsoleView() {
  const {
    params: {
      endpointId: environmentId,
      container,
      name: appName,
      namespace,
      pod: podID,
    },
  } = useCurrentStateAndParams();

  const [command, setCommand] = useState('/bin/sh');
  const [connect, setConnect] = useState(false);
  const [shellState, setShellState] = useState<ShellState>('idle');

  const breadcrumbs = [
    { label: 'Namespaces', link: 'kubernetes.resourcePools' },
    {
      label: namespace,
      link: 'kubernetes.resourcePools.resourcePool',
      linkParams: { id: namespace },
    },
    { label: 'Applications', link: 'kubernetes.applications' },
    {
      label: appName,
      link: 'kubernetes.applications.application',
      linkParams: { name: appName, namespace },
    },
    'Pods',
    podID,
    'Containers',
    container,
    'Console',
  ];

  return (
    <>
      <PageHeader
        title="Application console"
        breadcrumbs={breadcrumbs}
        reload
      />
      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetBody>
              <div className="row">
                <div className="col-sm-12 form-section-title">Console</div>
              </div>
              <div className="form-row flex">
                <label
                  htmlFor="consoleCommand"
                  className="col-sm-3 col-lg-2 control-label m-0 p-0 text-left"
                >
                  Command
                  <TerminalTooltip />
                </label>
                <div className="col-sm-8 input-group p-0">
                  <span className="input-group-addon">
                    <Icon icon={TerminalIcon} className="mr-1" />
                  </span>
                  <Input
                    type="text"
                    className="form-control"
                    placeholder="/bin/bash"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    id="consoleCommand"
                    disabled={connect}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    data-cy="console-command-input"
                  />
                </div>
              </div>
              <div className="row mt-4">
                <Button
                  className="btn btn-primary !ml-0"
                  data-cy="connect-console-button"
                  onClick={connect ? handleDisconnect : handleConnect}
                  disabled={shellState === 'connecting'}
                >
                  {shellState === 'connected' && 'Disconnect'}
                  {shellState === 'connecting' && 'Connecting'}
                  {shellState !== 'connecting' &&
                    shellState !== 'connected' &&
                    'Connect'}
                </Button>
              </div>
            </WidgetBody>
          </Widget>
          <div className="row">
            <div className="col-sm-12 p-0">
              <Terminal
                url={buildUrl()}
                connect={connect}
                onStateChange={handleStateChange}
                onResize="socket"
                initialCommands={
                  isLinuxTerminalCommand(command)
                    ? LINUX_SHELL_INIT_COMMANDS
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );

  function handleConnect() {
    setConnect(true);
  }

  function handleDisconnect() {
    setConnect(false);
  }

  function handleStateChange(state: ShellState) {
    if (state === 'disconnected') {
      setConnect(false);
    }
    setShellState(state);
  }

  function buildUrl() {
    const params: Record<string, string> = {
      endpointId: environmentId,
      namespace,
      podName: podID,
      containerName: container,
      command,
    };

    const queryParams = Object.keys(params)
      .map((k) => `${k}=${params[k]}`)
      .join('&');

    let url = `${
      window.location.origin
    }${baseHref()}api/websocket/pod?${queryParams}`;
    if (url.indexOf('https') > -1) {
      url = url.replace('https://', 'wss://');
    } else {
      url = url.replace('http://', 'ws://');
    }
    return url;
  }
}
