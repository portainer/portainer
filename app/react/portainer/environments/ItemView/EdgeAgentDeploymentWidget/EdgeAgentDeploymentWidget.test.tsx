import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';

import { EdgeAgentDeploymentWidget } from './EdgeAgentDeploymentWidget';

vi.mock('@/react/edge/components/EdgeScriptForm', () => ({
  EdgeScriptForm: ({
    edgeInfo,
    commands,
    asyncMode,
  }: {
    edgeInfo: { key: string; id?: string };
    commands: { linux: Array<unknown>; win: Array<unknown> };
    asyncMode?: boolean;
  }) => (
    <div data-cy="edge-script-form">
      <div data-cy="edge-info-key">{edgeInfo.key}</div>
      <div data-cy="edge-info-id">{edgeInfo.id || 'undefined'}</div>
      <div data-cy="async-mode">{String(asyncMode)}</div>
      <div data-cy="commands-type">{JSON.stringify(commands)}</div>
    </div>
  ),
}));

vi.mock('@/react/portainer/environments/ItemView/EdgeKeyDisplay', () => ({
  EdgeKeyDisplay: ({ edgeKey }: { edgeKey: string }) => (
    <div data-cy="edge-key-display">{edgeKey}</div>
  ),
}));

describe('EdgeAgentDeploymentWidget', () => {
  it('should render widget with deployment sections', () => {
    renderComponent({ edgeKey: 'test-edge-key-123' });

    // Check for key UI elements that must be present
    expect(screen.getByText('Deploy an agent')).toBeVisible();
    expect(screen.getByText('Edge agent deployment script')).toBeVisible();
    expect(screen.getByTestId('edge-script-form')).toBeVisible();
    expect(screen.getByTestId('edge-key-display')).toBeVisible();
  });

  it('should render EdgeScriptForm with correct edgeInfo', () => {
    renderComponent({
      edgeKey: 'test-edge-key-123',
      edgeId: 'edge-id-456',
    });

    expect(screen.getByTestId('edge-script-form')).toBeInTheDocument();
    expect(screen.getByTestId('edge-info-key')).toHaveTextContent(
      'test-edge-key-123'
    );
    expect(screen.getByTestId('edge-info-id')).toHaveTextContent('edge-id-456');
  });

  it('should render EdgeScriptForm with undefined edgeId when not provided', () => {
    renderComponent({
      edgeKey: 'test-edge-key-123',
    });

    expect(screen.getByTestId('edge-info-id')).toHaveTextContent('undefined');
  });

  it('should pass asyncMode prop to EdgeScriptForm', () => {
    renderComponent({
      edgeKey: 'test-edge-key-123',
      asyncMode: true,
    });

    expect(screen.getByTestId('async-mode')).toHaveTextContent('true');
  });

  it('should pass asyncMode as undefined when not provided', () => {
    renderComponent({
      edgeKey: 'test-edge-key-123',
    });

    expect(screen.getByTestId('async-mode')).toHaveTextContent('undefined');
  });

  it('should construct commands with linux and windows platforms', () => {
    renderComponent({
      edgeKey: 'test-edge-key-123',
    });

    const commandsText = screen.getByTestId('commands-type').textContent;
    const commands = JSON.parse(commandsText || '{}');

    expect(commands).toHaveProperty('linux');
    expect(commands).toHaveProperty('win');
    expect(Array.isArray(commands.linux)).toBe(true);
    expect(Array.isArray(commands.win)).toBe(true);
  });

  it('should include correct linux commands', () => {
    renderComponent({
      edgeKey: 'test-edge-key-123',
    });

    const commandsText = screen.getByTestId('commands-type').textContent;
    const commands = JSON.parse(commandsText || '{}');

    // Should have 4 linux commands: k8s, swarm, standalone, podman
    expect(commands.linux.length).toBe(4);
    const platforms = commands.linux.map((cmd: { id: string }) => cmd.id);
    expect(platforms).toContain('k8s');
    expect(platforms).toContain('swarm');
    expect(platforms).toContain('standalone');
    expect(platforms).toContain('podman');
  });

  it('should include correct windows commands', () => {
    renderComponent({
      edgeKey: 'test-edge-key-123',
    });

    const commandsText = screen.getByTestId('commands-type').textContent;
    const commands = JSON.parse(commandsText || '{}');

    // Should have 2 windows commands: swarm, standalone
    expect(commands.win.length).toBe(2);
    const platforms = commands.win.map((cmd: { id: string }) => cmd.id);
    expect(platforms).toContain('swarm');
    expect(platforms).toContain('standalone');
  });

  it('should render EdgeKeyDisplay with correct edgeKey', () => {
    renderComponent({
      edgeKey: 'test-edge-key-123',
    });

    const keyDisplay = screen.getByTestId('edge-key-display');
    expect(keyDisplay).toBeInTheDocument();
    expect(keyDisplay).toHaveTextContent('test-edge-key-123');
  });

  it('should render Widget structure', () => {
    const { container } = renderComponent({
      edgeKey: 'test-edge-key-123',
    });

    // Widget should have the widget structure
    const widget = container.querySelector('[class*="widget"]');
    expect(widget).toBeInTheDocument();
  });

  describe('Edge key decoding and display', () => {
    it('should decode and display valid edge key details', () => {
      const validKey = btoa('https://portainer.io|tunnel.example.com:8000');
      renderComponent({ edgeKey: validKey });

      expect(screen.getByText(/https:\/\/portainer\.io/)).toBeVisible();
      expect(
        screen.getByText(/tcp:\/\/tunnel\.example\.com:8000/)
      ).toBeVisible();
    });

    it('should handle invalid base64 gracefully', () => {
      renderComponent({ edgeKey: 'invalid-base64!!!' });

      // Should not crash and should render the widget
      expect(screen.getByText('Deploy an agent')).toBeVisible();
      expect(screen.getByText('Edge agent deployment script')).toBeVisible();
    });

    it('should handle empty edge key', () => {
      renderComponent({ edgeKey: '' });

      expect(screen.getByText('Deploy an agent')).toBeVisible();
      expect(screen.getByText('Edge agent deployment script')).toBeVisible();
    });

    it('should handle edge key with missing pipe delimiter', () => {
      const keyWithoutPipe = btoa('https://portainer.io');
      renderComponent({ edgeKey: keyWithoutPipe });

      // Should decode but show empty tunnel address
      expect(screen.getByText(/https:\/\/portainer\.io/)).toBeVisible();
    });

    it('should handle edge key with only pipe delimiter', () => {
      const keyWithOnlyPipe = btoa('|');
      renderComponent({ edgeKey: keyWithOnlyPipe });

      // Should not crash
      expect(screen.getByText('Deploy an agent')).toBeVisible();
    });

    it('should handle edge key with multiple pipe delimiters', () => {
      const keyWithMultiplePipes = btoa(
        'https://portainer.io|tunnel.example.com:8000|extra'
      );
      renderComponent({ edgeKey: keyWithMultiplePipes });

      // Should use first two parts only
      expect(screen.getByText(/https:\/\/portainer\.io/)).toBeVisible();
      expect(
        screen.getByText(/tcp:\/\/tunnel\.example\.com:8000/)
      ).toBeVisible();
    });
  });
});

interface RenderOptions {
  edgeKey: string;
  edgeId?: string;
  asyncMode?: boolean;
}

function renderComponent({ edgeKey, edgeId, asyncMode }: RenderOptions) {
  const Wrapper = withTestQueryProvider(
    withUserProvider(EdgeAgentDeploymentWidget)
  );
  return render(
    <Wrapper edgeKey={edgeKey} edgeId={edgeId} asyncMode={asyncMode} />
  );
}
