import { useState, useCallback, useEffect } from 'react';
import { useCurrentStateAndParams } from '@uirouter/react';
import { Terminal as TerminalIcon } from 'lucide-react';
import { Terminal } from 'xterm';

import { baseHref } from '@/portainer/helpers/pathHelper';
import { notifyError } from '@/portainer/services/notifications';
import { TerminalTooltip } from '@/react/components/TerminalTooltip';

import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody } from '@@/Widget';
import { Icon } from '@@/Icon';
import { Button } from '@@/buttons';
import { Input } from '@@/form-components/Input';

interface StringDictionary {
  [index: string]: string;
}

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
  const [connectionStatus, setConnectionStatus] = useState('closed');
  const [terminal, setTerminal] = useState(null as Terminal | null);
  const [socket, setSocket] = useState(null as WebSocket | null);

  const breadcrumbs = [
    {
      label: 'Namespaces',
      link: 'kubernetes.resourcePools',
    },
    {
      label: namespace,
      link: 'kubernetes.resourcePools.resourcePool',
      linkParams: { id: namespace },
    },
    {
      label: 'Applications',
      link: 'kubernetes.applications',
    },
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

  const disconnectConsole = useCallback(() => {
    socket?.close();
    terminal?.dispose();
    setTerminal(null);
    setSocket(null);
    setConnectionStatus('closed');
  }, [socket, terminal, setConnectionStatus]);

  useEffect(() => {
    if (socket) {
      socket.onopen = () => {
        const terminalContainer = document.getElementById('terminal-container');
        if (terminalContainer) {
          terminal?.open(terminalContainer);
          terminal?.setOption('cursorBlink', true);
          terminal?.focus();
          setConnectionStatus('open');
          socket.send('export LANG=C.UTF-8\n');
          socket.send('export LC_ALL=C.UTF-8\n');
          socket.send('clear\n');
        }
      };

      socket.onmessage = (msg) => {
        const encoded = new TextEncoder().encode(msg.data);
        terminal?.writeUtf8(encoded);
      };

      socket.onerror = () => {
        disconnectConsole();
        notifyError('Websocket connection error');
      };

      socket.onclose = () => {
        disconnectConsole();
      };
    }
  }, [disconnectConsole, setConnectionStatus, socket, terminal]);

  useEffect(() => {
    terminal?.onData((data) => {
      socket?.send(data);
    });
  }, [terminal, socket]);

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
                    // disable eslint because we want to autofocus
                    // this is ok because we only have one input on the page
                    // https://portainer.atlassian.net/browse/EE-5752
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
                  onClick={
                    connectionStatus === 'closed'
                      ? connectConsole
                      : disconnectConsole
                  }
                  disabled={connectionStatus === 'connecting'}
                >
                  {connectionStatus === 'open' && 'Disconnect'}
                  {connectionStatus === 'connecting' && 'Connecting'}
                  {connectionStatus !== 'connecting' &&
                    connectionStatus !== 'open' &&
                    'Connect'}
                </Button>
              </div>
            </WidgetBody>
          </Widget>
          <div className="row">
            <div className="col-sm-12 p-0">
              <div id="terminal-container" className="terminal-container" />
            </div>
          </div>
        </div>
      </div>
    </>
  );

  function connectConsole() {
    const params: StringDictionary = {
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

    setConnectionStatus('connecting');
    const term = new Terminal();
    setTerminal(term);
    const socket = new WebSocket(url);
    setSocket(socket);
  }
}
