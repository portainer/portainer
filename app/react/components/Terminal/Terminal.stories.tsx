import { Meta } from '@storybook/react-webpack5';
import { ws } from 'msw';
import { useState } from 'react';

import { Button } from '@@/buttons';

import { Terminal } from './Terminal';
import type { ShellState } from './Terminal';

// Computed at module load so the handler URL matches whatever port Storybook runs on
const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const SHELL_WS_URL = `${wsProtocol}${window.location.host}/api/websocket/test-shell`;

const shellHandler = ws.link(SHELL_WS_URL);

const PROMPT = '\r\n\x1b[32muser@portainer\x1b[0m:\x1b[34m~\x1b[0m$ ';

const COMMANDS: Record<string, (args: string[]) => string> = {
  help: () =>
    'Available commands: clear, date, echo, exit, help, ls, pwd, whoami',
  echo: (args) => args.join(' '),
  ls: () =>
    '\x1b[34mbin\x1b[0m  \x1b[34metc\x1b[0m  \x1b[34mhome\x1b[0m  \x1b[32mapp\x1b[0m  \x1b[32mserver\x1b[0m  README.md',
  pwd: () => '/home/user',
  whoami: () => 'user',
  date: () => new Date().toString(),
};

function createBashHandler() {
  return shellHandler.addEventListener('connection', ({ client }) => {
    let buffer = '';

    client.send(
      'Portainer MSW shell — type \x1b[1mhelp\x1b[0m for available commands'
    );
    client.send(PROMPT);

    client.addEventListener('message', ({ data }) => {
      const str = String(data);

      // Escape sequences (arrow keys etc.) — ignore
      if (str.startsWith('\x1b')) {
        return;
      }

      str.split('').forEach((char) => {
        if (char === '\r') {
          onEnter();
        } else if (char === '\x7f' || char === '\b') {
          onBackspace();
        } else if (char === '\x03') {
          onCtrlC();
        } else if (char === '\x04') {
          onCtrlD();
        } else if (char === '\x0c') {
          onCtrlL();
        } else if (char.charCodeAt(0) >= 32) {
          buffer += char;
          client.send(char);
        }
      });
    });

    function onEnter() {
      const cmd = buffer.trim();
      buffer = '';
      client.send('\r\n');

      if (!cmd) {
        client.send(PROMPT);
        return;
      }

      const [command, ...args] = cmd.split(/\s+/);

      if (command === 'exit') {
        client.send('logout\r\n');
        setTimeout(() => client.close(), 200);
        return;
      }

      if (command === 'clear') {
        client.send('\x1b[2J\x1b[H');
        client.send(PROMPT);
        return;
      }

      const handler = COMMANDS[command];
      if (handler) {
        client.send(handler(args));
      } else {
        client.send(`\x1b[31mbash: ${command}: command not found\x1b[0m`);
      }

      client.send(PROMPT);
    }

    function onBackspace() {
      if (buffer.length === 0) return;
      buffer = buffer.slice(0, -1);
      client.send('\b \b');
    }

    function onCtrlC() {
      buffer = '';
      client.send('^C');
      client.send(PROMPT);
    }

    function onCtrlD() {
      client.send('\r\nlogout\r\n');
      client.close();
    }

    function onCtrlL() {
      buffer = '';
      client.send('\x1b[2J\x1b[H');
      client.send(PROMPT);
    }
  });
}

const meta: Meta = {
  title: 'Components/Terminal',
  component: Terminal,
};
export default meta;

export function AutoConnect() {
  return (
    <div className="h-[400px]">
      <Terminal url={SHELL_WS_URL} connect />
    </div>
  );
}
AutoConnect.parameters = {
  msw: { handlers: [createBashHandler()] },
};

export function WithConnectButton() {
  const [connect, setConnect] = useState(false);
  const [state, setState] = useState<ShellState>('idle');

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Button
          onClick={() => setConnect((c) => !c)}
          disabled={state === 'connecting'}
          data-cy="connect button"
        >
          {state === 'connected' ? 'Disconnect' : 'Connect'}
        </Button>
        <span className="text-gray-500 text-sm">state: {state}</span>
      </div>
      <div className="h-[400px]">
        <Terminal
          url={SHELL_WS_URL}
          connect={connect}
          onStateChange={setState}
        />
      </div>
    </div>
  );
}
WithConnectButton.parameters = {
  msw: { handlers: [createBashHandler()] },
};

export function ServerDisconnects() {
  return (
    <div className="h-[400px]">
      <Terminal url={SHELL_WS_URL} connect />
    </div>
  );
}
ServerDisconnects.parameters = {
  msw: {
    handlers: [
      shellHandler.addEventListener('connection', ({ client }) => {
        client.send('# Closing in 2s...\r\n');
        setTimeout(() => client.close(), 2000);
      }),
    ],
  },
};
