import { render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

import { error as notifyError } from '@/portainer/services/notifications';
import { server, ws } from '@/setup-tests/server';

import { Terminal } from './Terminal';

type WSConnection = Parameters<
  Parameters<ReturnType<typeof ws.link>['addEventListener']>[1]
>[0];
type ClientConnection = WSConnection['client'];

const wssLink = ws.link('wss://*/*');

vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn(
    class {
      open = vi.fn();

      options = {};

      focus = vi.fn();

      loadAddon = vi.fn();

      write = vi.fn();

      onData = vi.fn();

      onKey = vi.fn();

      dispose = vi.fn();
    }
  ),
}));

vi.mock('@xterm/addon-fit', () => ({
  FitAddon: vi.fn(
    class {
      fit = vi.fn();
    }
  ),
}));

vi.mock('@/portainer/services/notifications', () => ({
  error: vi.fn(),
}));

let mockTerminalInstance: Partial<XTerm>;
let mockFitAddonInstance: Partial<FitAddon>;
let mockResizeObserverObserve: ReturnType<typeof vi.fn>;
let mockResizeObserverDisconnect: ReturnType<typeof vi.fn>;
let mockResizeObserverCallback: ResizeObserverCallback;

beforeEach(() => {
  vi.clearAllMocks();

  mockFitAddonInstance = { fit: vi.fn() };

  mockTerminalInstance = {
    open: vi.fn(),
    options: {},
    focus: vi.fn(),
    loadAddon: vi.fn(),
    write: vi.fn(),
    onData: vi.fn(),
    onKey: vi.fn(),
    dispose: vi.fn(),
    rows: 24,
    cols: 80,
  };

  vi.mocked(XTerm).mockImplementation(function XTerm(this: XTerm) {
    Object.assign(this, mockTerminalInstance);
  });

  vi.mocked(FitAddon).mockImplementation(function FitAddon(this: FitAddon) {
    Object.assign(this, mockFitAddonInstance);
  });

  mockResizeObserverObserve = vi.fn();
  mockResizeObserverDisconnect = vi.fn();
  globalThis.ResizeObserver = vi
    .fn()
    .mockImplementation(function ResizeObserver(
      this: ResizeObserver,
      callback: ResizeObserverCallback
    ) {
      mockResizeObserverCallback = callback;
      return {
        observe: mockResizeObserverObserve,
        disconnect: mockResizeObserverDisconnect,
      };
    });

  server.use(
    wssLink.addEventListener('connection', ({ client, server }) => {
      client.addEventListener('message', (event) => {
        server.send(event.data);
      });
    })
  );
});

const TEST_URL = 'wss://localhost:3000/api/test';

describe('Terminal', () => {
  describe('connection lifecycle', () => {
    it('does not create terminal when connect=false', () => {
      render(<Terminal url={TEST_URL} connect={false} />);
      expect(vi.mocked(XTerm)).not.toHaveBeenCalled();
    });

    it('calls onStateChange with connecting immediately when connect=true', () => {
      const onStateChange = vi.fn();
      render(<Terminal url={TEST_URL} connect onStateChange={onStateChange} />);
      expect(onStateChange).toHaveBeenCalledWith('connecting');
    });

    it('calls onStateChange with connected when socket opens', async () => {
      const onStateChange = vi.fn();

      render(<Terminal url={TEST_URL} connect onStateChange={onStateChange} />);

      // Wait for the terminal to open (same event that triggers 'connected')
      await waitFor(() => expect(mockTerminalInstance.open).toHaveBeenCalled());
      expect(onStateChange).toHaveBeenCalledWith('connected');
    });

    it('calls onStateChange with disconnected when socket closes', async () => {
      const onStateChange = vi.fn();
      let clientConnection: ClientConnection | undefined;

      server.use(
        wssLink.addEventListener('connection', ({ client }) => {
          clientConnection = client;
        })
      );

      render(<Terminal url={TEST_URL} connect onStateChange={onStateChange} />);

      await waitFor(() => expect(clientConnection).toBeDefined());
      clientConnection!.close();

      await waitFor(() => {
        expect(onStateChange).toHaveBeenCalledWith('disconnected');
      });
    });
  });

  describe('terminal initialization', () => {
    it('opens on socket open', async () => {
      render(<Terminal url={TEST_URL} connect />);

      await waitFor(() => {
        expect(mockTerminalInstance.open).toHaveBeenCalled();
      });
    });

    it('registers resize observer on container element', async () => {
      render(<Terminal url={TEST_URL} connect />);

      await waitFor(() => expect(mockTerminalInstance.open).toHaveBeenCalled());

      expect(mockResizeObserverObserve).toHaveBeenCalledWith(
        expect.any(HTMLElement)
      );
    });

    it('fits terminal when container resizes', async () => {
      render(<Terminal url={TEST_URL} connect />);

      await waitFor(() => expect(mockTerminalInstance.open).toHaveBeenCalled());

      mockResizeObserverCallback([], {} as ResizeObserver);

      expect(mockFitAddonInstance.fit).toHaveBeenCalled();
    });
  });

  describe('data flow', () => {
    it('forwards terminal input to WebSocket', async () => {
      let receivedData: string | undefined;

      server.use(
        wssLink.addEventListener('connection', ({ client }) => {
          client.addEventListener('message', (event) => {
            receivedData = event.data as string;
          });
        })
      );

      render(<Terminal url={TEST_URL} connect />);

      await waitFor(() =>
        expect(mockTerminalInstance.onData).toHaveBeenCalled()
      );

      const onDataCallback = vi.mocked(mockTerminalInstance.onData!).mock
        .calls[0]![0] as (data: string) => void;

      onDataCallback('kubectl get pods');

      await waitFor(() => expect(receivedData).toBe('kubectl get pods'));
    });

    it('writes WebSocket messages to terminal as Uint8Array', async () => {
      server.use(
        wssLink.addEventListener('connection', ({ client }) => {
          client.send('server output');
        })
      );

      render(<Terminal url={TEST_URL} connect />);

      await waitFor(() =>
        expect(mockTerminalInstance.write).toHaveBeenCalled()
      );

      const [data] = vi.mocked(mockTerminalInstance.write!).mock.calls[0];
      expect(new TextDecoder().decode(data as Uint8Array)).toBe(
        'server output'
      );
    });
  });

  describe('cleanup', () => {
    it('disposes terminal and disconnects resize observer when socket closes', async () => {
      let clientConnection: ClientConnection | undefined;

      server.use(
        wssLink.addEventListener('connection', ({ client }) => {
          clientConnection = client;
        })
      );

      render(<Terminal url={TEST_URL} connect />);

      await waitFor(() => expect(clientConnection).toBeDefined());
      await waitFor(() => expect(mockTerminalInstance.open).toHaveBeenCalled());

      clientConnection!.close();

      await waitFor(() =>
        expect(mockTerminalInstance.dispose).toHaveBeenCalled()
      );
      expect(mockResizeObserverDisconnect).toHaveBeenCalled();
    });

    it('disposes terminal and disconnects resize observer on unmount', async () => {
      let clientConnection: ClientConnection | undefined;

      server.use(
        wssLink.addEventListener('connection', ({ client }) => {
          clientConnection = client;
        })
      );

      const { unmount } = render(<Terminal url={TEST_URL} connect />);

      await waitFor(() => expect(clientConnection).toBeDefined());
      await waitFor(() => expect(mockTerminalInstance.open).toHaveBeenCalled());

      unmount();

      expect(mockTerminalInstance.dispose).toHaveBeenCalled();
      expect(mockResizeObserverDisconnect).toHaveBeenCalled();
    });
  });

  describe('onResize', () => {
    it('calls onResize with terminal dimensions after initial connection', async () => {
      const onResize = vi.fn();

      render(<Terminal url={TEST_URL} connect onResize={onResize} />);

      await waitFor(() =>
        expect(onResize).toHaveBeenCalledWith({ rows: 24, cols: 80 })
      );
    });

    it('calls onResize with terminal dimensions when connect changes to true', async () => {
      const onResize = vi.fn();

      const { rerender } = render(
        <Terminal url={TEST_URL} connect={false} onResize={onResize} />
      );
      expect(onResize).not.toHaveBeenCalled();

      rerender(<Terminal url={TEST_URL} connect onResize={onResize} />);

      await waitFor(() =>
        expect(onResize).toHaveBeenCalledWith({ rows: 24, cols: 80 })
      );
    });

    // mockResizeObserver doesn't trigger resize
    it.todo(
      'calls onResize with terminal dimensions when container resizes',
      async () => {
        const onResize = vi.fn();

        render(<Terminal url={TEST_URL} connect onResize={onResize} />);

        await waitFor(() =>
          expect(mockTerminalInstance.open).toHaveBeenCalled()
        );
        onResize.mockClear();

        mockResizeObserverCallback([], {} as ResizeObserver);

        expect(onResize).toHaveBeenCalledWith({ rows: 24, cols: 80 });
      }
    );

    it('does not call onResize when connect=false', () => {
      const onResize = vi.fn();

      render(<Terminal url={TEST_URL} connect={false} onResize={onResize} />);

      expect(onResize).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('does not show error notification when socket closes cleanly', async () => {
      server.use(
        wssLink.addEventListener('connection', ({ client }) => {
          client.close();
        })
      );

      const onStateChange = vi.fn();
      render(<Terminal url={TEST_URL} connect onStateChange={onStateChange} />);

      await waitFor(() => {
        expect(onStateChange).toHaveBeenCalledWith('disconnected');
      });
      expect(vi.mocked(notifyError)).not.toHaveBeenCalled();
    });
  });
});
