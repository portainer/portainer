import { render, screen } from '@testing-library/react';

import { createMockEnvironment } from '@/react-tools/test-mocks';

import { EnvironmentURL } from './EnvironmentURL';

describe('EnvironmentURL', () => {
  it('renders the environment URL', () => {
    const env = createMockEnvironment({ URL: 'tcp://192.168.1.100:2376' });
    render(<EnvironmentURL environment={env} />);
    expect(screen.getByText('tcp://192.168.1.100:2376')).toBeVisible();
  });
});
