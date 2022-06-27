import { Terminal } from 'xterm';
import { fit } from 'xterm/lib/addons/fit/fit';
import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { baseHref } from '@/portainer/helpers/pathHelper';
import {
  terminalClose,
  terminalResize,
} from '@/portainer/services/terminal-window';
import { EnvironmentId } from '@/portainer/environments/types';
import { error as notifyError } from '@/portainer/services/notifications';
import { useLocalStorage } from '@/portainer/hooks/useLocalStorage';

import { Button } from '@@/buttons';

import styles from './KubectlShell.module.css';

interface ShellState {
  socket: WebSocket | null;
  minimized: boolean;
}

interface Props {
  environmentId: EnvironmentId;
  onClose(): void;
}

export function KubeCtlShell({ environmentId, onClose }: Props) {
  const [terminal] = useState(new Terminal());

  const [shell, setShell] = useState<ShellState>({
    socket: null,
    minimized: false,
  });

  const { socket } = shell;

  const terminalElem = useRef(null);

  const [jwt] = useLocalStorage('JWT', '');

  const handleClose = useCallback(() => {
    terminalClose(); // only css trick
    socket?.close();
    terminal.dispose();
    onClose();
  }, [onClose, terminal, socket]);

  const openTerminal = useCallback(() => {
    if (!terminalElem.current) {
      return;
    }

    terminal.open(terminalElem.current);
    terminal.setOption('cursorBlink', true);
    terminal.focus();
    fit(terminal);
    terminal.writeln('#Run kubectl commands inside here');
    terminal.writeln('#e.g. kubectl get all');
    terminal.writeln('');
  }, [terminal]);

  // refresh socket listeners on socket updates
  useEffect(() => {
    if (!socket) {
      return () => {};
    }
    function onOpen() {
      openTerminal();
    }
    function onMessage(e: MessageEvent) {
      terminal.write(e.data);
    }
    function onClose() {
      handleClose();
    }
    function onError(e: Event) {
      handleClose();
      if (socket?.readyState !== WebSocket.CLOSED) {
        notifyError(
          'Failure',
          e as unknown as Error,
          'Websocket connection error'
        );
      }
    }

    socket.addEventListener('open', onOpen);
    socket.addEventListener('message', onMessage);
    socket.addEventListener('close', onClose);
    socket.addEventListener('error', onError);

    return () => {
      socket.removeEventListener('open', onOpen);
      socket.removeEventListener('message', onMessage);
      socket.removeEventListener('close', onClose);
      socket.removeEventListener('error', onError);
    };
  }, [handleClose, openTerminal, socket, terminal]);

  // on component load/destroy
  useEffect(() => {
    const socket = new WebSocket(buildUrl(jwt, environmentId));
    setShell((shell) => ({ ...shell, socket }));

    terminal.onData((data) => socket.send(data));
    terminal.onKey(({ domEvent }) => {
      if (domEvent.ctrlKey && domEvent.code === 'KeyD') {
        close();
      }
    });

    window.addEventListener('resize', () => terminalResize());

    function close() {
      socket.close();
      terminal.dispose();
      window.removeEventListener('resize', terminalResize);
    }

    return close;
  }, [environmentId, jwt, terminal]);

  return (
    <div className={clsx(styles.root, { [styles.minimized]: shell.minimized })}>
      <div className={styles.header}>
        <div className={styles.title}>
          <i className="fas fa-terminal space-right" />
          kubectl shell
        </div>
        <div className={clsx(styles.actions, 'space-x-8')}>
          <Button color="link" onClick={clearScreen}>
            <i className="fas fa-redo-alt" data-cy="k8sShell-refreshButton" />
          </Button>
          <Button color="link" onClick={toggleMinimize}>
            <i
              className={clsx(
                'fas',
                shell.minimized ? 'fa-window-restore' : 'fa-window-minimize'
              )}
              data-cy={
                shell.minimized ? 'k8sShell-restore' : 'k8sShell-minimise'
              }
            />
          </Button>
          <Button color="link" onClick={handleClose}>
            <i className="fas fa-times" data-cy="k8sShell-closeButton" />
          </Button>
        </div>
      </div>

      <div className={styles.terminalContainer} ref={terminalElem}>
        <div className={styles.loadingMessage}>Loading Terminal...</div>
      </div>
    </div>
  );

  function clearScreen() {
    terminal.clear();
  }

  function toggleMinimize() {
    if (shell.minimized) {
      terminalResize();
      setShell((shell) => ({ ...shell, minimized: false }));
    } else {
      terminalClose();
      setShell((shell) => ({ ...shell, minimized: true }));
    }
  }

  function buildUrl(jwt: string, environmentId: EnvironmentId) {
    const params = {
      token: jwt,
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
