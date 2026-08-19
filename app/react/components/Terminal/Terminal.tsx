import { Terminal as XTerm } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { FitAddon } from '@xterm/addon-fit';
import { useEffect, useRef } from 'react';

import { error as notifyError } from '@/portainer/services/notifications';

export type ShellState = 'idle' | 'connecting' | 'connected' | 'disconnected';

export interface TerminalDimensions {
  rows: number;
  cols: number;
}

export const LINUX_SHELL_INIT_COMMANDS = [
  'export LANG=C.UTF-8\n',
  'export LC_ALL=C.UTF-8\n',
  'export TERM="xterm-256color"\n',
  'alias ls="ls --color=auto"\n',
  'clear\n',
];

export function isLinuxTerminalCommand(command: string): boolean {
  const LINUX_SHELLS = [
    'bash',
    'sh',
    'zsh',
    'ash',
    'dash',
    'fish',
    'csh',
    'ksh',
  ];
  const basename = command.split('/').pop() ?? command;
  return LINUX_SHELLS.includes(basename);
}

interface Props {
  url: string;
  connect: boolean;
  onStateChange?: (state: ShellState) => void;
  onResize?: ((dimensions: TerminalDimensions) => void) | 'socket' | null;
  initialCommands?: string[];
}

export function Terminal({
  url,
  connect,
  onStateChange = () => {},
  onResize,
  initialCommands,
}: Props) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const termRef = useRef<XTerm | null>(null);

  useEffect(() => {
    if (!connect) {
      return () => {};
    }

    let fitAddon: FitAddon | null = null;
    let cleaned = false;
    let lastSentSize: { rows: number; cols: number } | null = null;

    onStateChange('connecting');

    const socket = new WebSocket(url);
    socketRef.current = socket;

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    socket.addEventListener('open', onOpen);
    socket.addEventListener('message', onMessage);
    socket.addEventListener('close', onClose);
    socket.addEventListener('error', onError);

    return cleanup;

    function onOpen() {
      if (!terminalRef.current) {
        return;
      }
      const term = new XTerm();
      termRef.current = term;
      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      term.options.cursorBlink = true;
      term.focus();
      setTimeout(() => {
        handleResize();
      }, 0);
      term.onData((data) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(data);
        }
      });
      term.onKey(({ domEvent }) => {
        if (domEvent.ctrlKey && domEvent.key === 'd') {
          cleanup();
        }
      });
      resizeObserver.observe(terminalRef.current);
      initialCommands?.forEach((cmd) => socket.send(cmd));
      onStateChange('connected');
    }

    function onMessage(e: MessageEvent) {
      const encoded = new TextEncoder().encode(e.data);
      termRef.current?.write(encoded);
    }

    function onClose() {
      cleanup();
    }

    function onError(e: Event) {
      if (socket.readyState !== WebSocket.CLOSED) {
        notifyError('Failure', e, 'Websocket connection error');
      }
      cleanup();
    }

    function cleanup() {
      if (cleaned) return;
      cleaned = true;
      socket.removeEventListener('open', onOpen);
      socket.removeEventListener('message', onMessage);
      socket.removeEventListener('close', onClose);
      socket.removeEventListener('error', onError);
      resizeObserver.disconnect();
      socket.close();
      termRef.current?.dispose();
      termRef.current = null;
      socketRef.current = null;
      fitAddon = null;
      onStateChange('disconnected');
    }

    function handleResize() {
      fitAddon?.fit();
      if (termRef.current) {
        const { rows, cols } = termRef.current;
        if (lastSentSize?.rows === rows && lastSentSize?.cols === cols) {
          return;
        }

        lastSentSize = { rows, cols };
        if (typeof onResize === 'function') {
          onResize({ rows, cols });
        } else if (
          onResize === 'socket' &&
          socket.readyState === WebSocket.OPEN
        ) {
          socket.send(
            JSON.stringify({
              type: 'resize',
              data: { width: cols, height: rows },
            })
          );
        }
      }
    }
    // onStateChange, onResize, and initialCommands intentionally excluded — callers pass stable refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connect, url]);

  return <div ref={terminalRef} className="h-full" />;
}
