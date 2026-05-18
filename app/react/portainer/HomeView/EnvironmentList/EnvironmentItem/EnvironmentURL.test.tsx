import { render, screen } from '@testing-library/react';

import { createMockEnvironment } from '@/react-tools/test-mocks';
import { EnvironmentType } from '@/react/portainer/environments/types';

import { EnvironmentURL } from './EnvironmentURL';

describe('EnvironmentURL', () => {
  it('renders the environment URL for non-edge environments', () => {
    const env = createMockEnvironment({ URL: 'tcp://192.168.1.100:2376' });
    render(<EnvironmentURL environment={env} />);
    expect(screen.getByText('tcp://192.168.1.100:2376')).toBeVisible();
  });

  it('renders nothing for EdgeAgentOnDocker environments', () => {
    const env = createMockEnvironment({
      Type: EnvironmentType.EdgeAgentOnDocker,
      URL: 'tcp://192.168.1.100:2376',
    });
    const { container } = render(<EnvironmentURL environment={env} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for EdgeAgentOnKubernetes environments', () => {
    const env = createMockEnvironment({
      Type: EnvironmentType.EdgeAgentOnKubernetes,
      URL: 'tcp://192.168.1.100:2376',
    });
    const { container } = render(<EnvironmentURL environment={env} />);
    expect(container).toBeEmptyDOMElement();
  });
});
