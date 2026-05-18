import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

import { DeploymentScripts } from './DeploymentScripts';

describe('DeploymentScripts', () => {
  it('uses the same OS labels as the Docker agent tab and switches socket examples', async () => {
    const user = userEvent.setup();
    render(<DeploymentScripts />);

    expect(
      screen.getByRole('button', { name: 'Linux & Windows WSL' })
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Windows WCS' })).toBeVisible();

    expect(screen.getByText(/var\/run\/docker\.sock/)).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Windows WCS' }));

    expect(
      screen.getByText('-v \\.\\pipe\\docker_engine:\\.\\pipe\\docker_engine')
    ).toBeVisible();
  });
});
