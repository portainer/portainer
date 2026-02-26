import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Terminal } from 'xterm';
import { fit } from 'xterm/lib/addons/fit/fit';

import { terminalClose } from '@/portainer/services/terminal-window';
import { error as notifyError } from '@/portainer/services/notifications';
import { server, ws } from '@/setup-tests/server';

import { KubectlShellView } from './KubectlShellView';

// Type helpers for MSW WebSocket connections
type WSConnection = Parameters<
  Parameters<ReturnType<typeof ws.link>['addEventListener']>[1]
>[0];
type ClientConnection = WSConnection['client'];
type ServerConnection = WSConnection['server'];

// Shared WebSocket links for all tests
const wssLink = ws.link('wss://*/*');
const wsLink = ws.link('ws://*/*');

// Mock modules
vi.mock('xterm', () => ({
  Terminal: vi.fn(
    class {
      open = vi.fn();

      setOption = vi.fn();

      focus = vi.fn();

      writeln = vi.fn();

      writeUtf8 = vi.fn();

      onData = vi.fn();

      onKey = vi.fn();

      dispose = vi.fn();
    }
  ),
}));

vi.mock('xterm/lib/addons/fit/fit', () => ({
  fit: vi.fn(),
}));

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => 1,
}));

vi.mock('@/portainer/helpers/pathHelper', () => ({
  baseHref: vi.fn().mockReturnValue('/portainer/'),
}));

vi.mock('@/portainer/services/terminal-window', () => ({
  terminalClose: vi.fn(),
}));

vi.mock('@/portainer/services/notifications', () => ({
  error: vi.fn(),
}));

let mockTerminalInstance: Partial<Terminal>;

beforeEach(() => {
  vi.clearAllMocks();

  mockTerminalInstance = {
    open: vi.fn(),
    setOption: vi.fn(),
    focus: vi.fn(),
    writeln: vi.fn(),
    writeUtf8: vi.fn(),
    onData: vi.fn(),
    onKey: vi.fn(),
    dispose: vi.fn(),
  };

  vi.mocked(Terminal).mockImplementation(function Terminal(this: Terminal) {
    Object.assign(this, mockTerminalInstance);
  });

  Object.defineProperty(window, 'location', {
    value: { protocol: 'https:', host: 'localhost:3000' },
    writable: true,
  });

  Object.defineProperty(window, 'addEventListener', {
    value: vi.fn(),
    writable: true,
  });

  Object.defineProperty(window, 'removeEventListener', {
    value: vi.fn(),
    writable: true,
  });

  // Set up default echo handler for tests that don't need custom behavior
  server.use(
    wssLink.addEventListener('connection', ({ client, server }) => {
      client.addEventListener('message', (event) => {
        server.send(event.data);
      });
    })
  );
});

describe('KubectlShellView', () => {
  it('renders loading state initially', () => {
    render(<KubectlShellView />);
    expect(screen.getByText('Loading Terminal...')).toBeInTheDocument();
  });

  it('creates WebSocket connection with correct URL', async () => {
    let connectionUrl: string | undefined;

    server.use(
      wssLink.addEventListener('connection', ({ client }) => {
        connectionUrl = client.url.toString();
      })
    );

    render(<KubectlShellView />);

    await waitFor(() => expect(connectionUrl).toBeDefined());
    expect(connectionUrl).toBe(
      'wss://localhost:3000/portainer/api/websocket/kubernetes-shell?endpointId=1'
    );
  });

  it('creates WebSocket connection with ws protocol when location is http', async () => {
    Object.defineProperty(window, 'location', {
      value: { protocol: 'http:', host: 'localhost:3000' },
      writable: true,
    });

    let connectionUrl: string | undefined;

    server.use(
      wsLink.addEventListener('connection', ({ client }) => {
        connectionUrl = client.url.toString();
      })
    );

    render(<KubectlShellView />);

    await waitFor(() => expect(connectionUrl).toBeDefined());
    expect(connectionUrl).toBe(
      'ws://localhost:3000/portainer/api/websocket/kubernetes-shell?endpointId=1'
    );
  });

  it('sets up terminal event handlers on mount', () => {
    render(<KubectlShellView />);
    expect(mockTerminalInstance.onData).toHaveBeenCalled();
    expect(mockTerminalInstance.onKey).toHaveBeenCalled();
  });

  it('adds window resize listener on mount', () => {
    render(<KubectlShellView />);
    expect(window.addEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );
  });

  it('sends terminal data to WebSocket when terminal data event fires', async () => {
    let receivedData: string | undefined;
    let connectionEstablished = false;

    server.use(
      wssLink.addEventListener('connection', ({ client }) => {
        connectionEstablished = true;
        client.addEventListener('message', (event) => {
          receivedData = event.data as string;
        });
      })
    );

    render(<KubectlShellView />);

    // Wait for WebSocket connection to be established
    await waitFor(() => expect(connectionEstablished).toBe(true));

    const onDataCallback = vi.mocked(mockTerminalInstance.onData!).mock
      .calls[0]![0] as (data: string) => void;
    onDataCallback('test data');

    await waitFor(() => expect(receivedData).toBe('test data'));
  });

  it('closes WebSocket and disposes terminal when Ctrl+D is pressed', async () => {
    let clientConnection: ClientConnection | undefined;

    server.use(
      wssLink.addEventListener('connection', ({ client }) => {
        clientConnection = client;
      })
    );

    render(<KubectlShellView />);
    await waitFor(() => expect(clientConnection).toBeDefined());

    const onKeyCallback = vi.mocked(mockTerminalInstance.onKey!).mock
      .calls[0]![0] as (event: { domEvent: KeyboardEvent }) => void;
    onKeyCallback({
      domEvent: { ctrlKey: true, code: 'KeyD' } as KeyboardEvent,
    });

    await waitFor(() => {
      expect(screen.getByText('Console disconnected')).toBeInTheDocument();
    });
    expect(mockTerminalInstance.dispose).toHaveBeenCalled();
  });

  it('handles user typing in terminal', async () => {
    let receivedData: string | undefined;
    let connectionEstablished = false;

    server.use(
      wssLink.addEventListener('connection', ({ client }) => {
        connectionEstablished = true;
        client.addEventListener('message', (event) => {
          receivedData = event.data as string;
        });
      })
    );

    render(<KubectlShellView />);

    // Wait for WebSocket connection to be established
    await waitFor(() => expect(connectionEstablished).toBe(true));

    const onDataCallback = vi.mocked(mockTerminalInstance.onData!).mock
      .calls[0]![0] as (data: string) => void;
    onDataCallback('kubectl get pods');

    await waitFor(() => expect(receivedData).toBe('kubectl get pods'));
  });

  it('handles Enter key in terminal', async () => {
    let receivedData: string | undefined;
    let connectionEstablished = false;

    server.use(
      wssLink.addEventListener('connection', ({ client }) => {
        connectionEstablished = true;
        client.addEventListener('message', (event) => {
          receivedData = event.data as string;
        });
      })
    );

    render(<KubectlShellView />);

    // Wait for WebSocket connection to be established
    await waitFor(() => expect(connectionEstablished).toBe(true));

    const onDataCallback = vi.mocked(mockTerminalInstance.onData!).mock
      .calls[0]![0] as (data: string) => void;
    onDataCallback('\r');

    await waitFor(() => expect(receivedData).toBe('\r'));
  });

  it('sets up WebSocket event listeners when socket is created', async () => {
    let clientConnection: ClientConnection | undefined;

    server.use(
      wssLink.addEventListener('connection', ({ client }) => {
        clientConnection = client;
      })
    );

    render(<KubectlShellView />);
    await waitFor(() => expect(clientConnection).toBeDefined());
    expect(clientConnection).toBeDefined();
  });

  it('opens terminal when WebSocket connection opens', async () => {
    let serverConnection: ServerConnection | undefined;

    server.use(
      wssLink.addEventListener('connection', ({ server: wsServer }) => {
        serverConnection = wsServer;
      })
    );

    render(<KubectlShellView />);
    await waitFor(() => expect(serverConnection).toBeDefined());

    await waitFor(() => {
      expect(mockTerminalInstance.open).toHaveBeenCalled();
    });
    expect(mockTerminalInstance.setOption).toHaveBeenCalledWith(
      'cursorBlink',
      true
    );
    expect(mockTerminalInstance.focus).toHaveBeenCalled();
    expect(vi.mocked(fit)).toHaveBeenCalledWith(mockTerminalInstance);
    expect(mockTerminalInstance.writeln).toHaveBeenCalledWith(
      '#Run kubectl commands inside here'
    );
    expect(mockTerminalInstance.writeln).toHaveBeenCalledWith(
      '#e.g. kubectl get all'
    );
    expect(mockTerminalInstance.writeln).toHaveBeenCalledWith('');
  });

  it('writes WebSocket message data to terminal', async () => {
    server.use(
      wssLink.addEventListener('connection', ({ client }) => {
        client.send('terminal output');
      })
    );

    render(<KubectlShellView />);

    await waitFor(() => expect(mockTerminalInstance.open).toHaveBeenCalled());

    await waitFor(() => {
      expect(mockTerminalInstance.writeUtf8).toHaveBeenCalled();
    });

    const writeCall = vi.mocked(mockTerminalInstance.writeUtf8)?.mock.calls[0];
    expect(new TextDecoder().decode(writeCall![0] as Uint8Array)).toBe(
      'terminal output'
    );
  });

  it('shows disconnected state when WebSocket closes', async () => {
    let clientConnection: ClientConnection | undefined;

    server.use(
      wssLink.addEventListener('connection', ({ client }) => {
        clientConnection = client;
      })
    );

    render(<KubectlShellView />);
    await waitFor(() => expect(clientConnection).toBeDefined());

    clientConnection!.close();

    await waitFor(() => {
      expect(screen.getByText('Console disconnected')).toBeInTheDocument();
    });
    expect(vi.mocked(terminalClose)).toHaveBeenCalled();
    expect(mockTerminalInstance.dispose).toHaveBeenCalled();
  });

  it('shows disconnected state when WebSocket errors', async () => {
    server.use(
      wssLink.addEventListener('connection', ({ client }) => {
        client.close(1003, 'Test error');
      })
    );

    render(<KubectlShellView />);

    await waitFor(() => {
      expect(screen.getByText('Console disconnected')).toBeInTheDocument();
    });
    expect(vi.mocked(terminalClose)).toHaveBeenCalled();
    expect(mockTerminalInstance.dispose).toHaveBeenCalled();
  });

  it('does not show error notification when WebSocket error occurs and socket is closed', async () => {
    server.use(
      wssLink.addEventListener('connection', ({ client }) => {
        client.close();
      })
    );

    render(<KubectlShellView />);

    await waitFor(() => {
      expect(screen.getByText('Console disconnected')).toBeInTheDocument();
    });
    expect(vi.mocked(notifyError)).not.toHaveBeenCalled();
  });

  it('renders reload button in disconnected state', async () => {
    let clientConnection: ClientConnection | undefined;

    server.use(
      wssLink.addEventListener('connection', ({ client }) => {
        clientConnection = client;
      })
    );

    render(<KubectlShellView />);
    await waitFor(() => expect(clientConnection).toBeDefined());
    clientConnection!.close();

    await waitFor(() => {
      const reloadButton = screen.getByTestId('k8sShell-reloadButton');
      expect(reloadButton).toBeInTheDocument();
      expect(reloadButton).toHaveTextContent('Reload');
    });
  });

  it('renders close button in disconnected state', async () => {
    let clientConnection: ClientConnection | undefined;

    server.use(
      wssLink.addEventListener('connection', ({ client }) => {
        clientConnection = client;
      })
    );

    render(<KubectlShellView />);
    await waitFor(() => expect(clientConnection).toBeDefined());
    clientConnection!.close();

    await waitFor(() => {
      const closeButton = screen.getByTestId('k8sShell-closeButton');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveTextContent('Close');
    });
  });

  it('reloads window when reload button is clicked', async () => {
    const user = userEvent.setup();
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: mockReload },
      writable: true,
    });

    let clientConnection: ClientConnection | undefined;

    server.use(
      wssLink.addEventListener('connection', ({ client }) => {
        clientConnection = client;
      })
    );

    render(<KubectlShellView />);
    await waitFor(() => expect(clientConnection).toBeDefined());
    clientConnection!.close();

    const reloadButton = await screen.findByTestId('k8sShell-reloadButton');
    expect(reloadButton).toHaveTextContent('Reload');

    await user.click(reloadButton);
    expect(mockReload).toHaveBeenCalled();
  });

  it('closes window when close button is clicked', async () => {
    const user = userEvent.setup();
    const mockClose = vi.fn();
    Object.defineProperty(window, 'close', {
      value: mockClose,
      writable: true,
    });

    let clientConnection: ClientConnection | undefined;

    server.use(
      wssLink.addEventListener('connection', ({ client }) => {
        clientConnection = client;
      })
    );

    render(<KubectlShellView />);
    await waitFor(() => expect(clientConnection).toBeDefined());
    clientConnection!.close();

    const closeButton = await screen.findByTestId('k8sShell-closeButton');
    expect(closeButton).toHaveTextContent('Close');

    await user.click(closeButton);
    expect(mockClose).toHaveBeenCalled();
  });

  it('removes event listeners on unmount', async () => {
    let clientConnection: ClientConnection | undefined;

    server.use(
      wssLink.addEventListener('connection', ({ client }) => {
        clientConnection = client;
      })
    );

    const { unmount } = render(<KubectlShellView />);
    await waitFor(() => expect(clientConnection).toBeDefined());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );
  });

  it('fits terminal on window resize', async () => {
    let clientConnection: ClientConnection | undefined;

    server.use(
      wssLink.addEventListener('connection', ({ client }) => {
        clientConnection = client;
      })
    );

    render(<KubectlShellView />);
    await waitFor(() => expect(clientConnection).toBeDefined());

    const resizeCallback = vi
      .mocked(window.addEventListener)
      .mock.calls.find(
        (call: unknown[]) => call[0] === 'resize'
      )![1] as () => void;

    resizeCallback();

    expect(vi.mocked(fit)).toHaveBeenCalledWith(mockTerminalInstance);
  });

  it('cleans up resources on unmount', async () => {
    let clientConnection: ClientConnection | undefined;

    server.use(
      wssLink.addEventListener('connection', ({ client }) => {
        clientConnection = client;
      })
    );

    const { unmount } = render(<KubectlShellView />);
    await waitFor(() => expect(clientConnection).toBeDefined());

    unmount();

    expect(mockTerminalInstance.dispose).toHaveBeenCalled();
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );
  });
});
