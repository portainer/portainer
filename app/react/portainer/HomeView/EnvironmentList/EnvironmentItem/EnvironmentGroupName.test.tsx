import { render, screen } from '@testing-library/react';

import { EnvironmentGroupName } from './EnvironmentGroupName';

describe('EnvironmentGroupName', () => {
  it('renders the provided group name', () => {
    render(<EnvironmentGroupName groupName="Production" />);
    expect(screen.getByText(/Production/)).toBeVisible();
  });

  it('renders Unassigned when no group name is provided', () => {
    render(<EnvironmentGroupName />);
    expect(screen.getByText(/Unassigned/)).toBeVisible();
  });
});
