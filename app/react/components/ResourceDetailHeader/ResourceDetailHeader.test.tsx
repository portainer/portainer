import { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';

import { ResourceDetailHeader } from './ResourceDetailHeader';
import { HeaderStats } from './HeaderStats';
import { ResourceStatBlock } from './ResourceStatBlock';

function renderComponent(
  props: Partial<ComponentProps<typeof ResourceDetailHeader>> = {}
) {
  const defaultProps: ComponentProps<typeof ResourceDetailHeader> = {
    title: 'Test Group',
    icon: <span data-cy="test-icon">icon</span>,
    ...props,
  };

  return render(<ResourceDetailHeader {...defaultProps} />);
}

describe('ResourceDetailHeader', () => {
  it('should render title and icon', () => {
    renderComponent();

    expect(screen.getByText('Test Group')).toBeVisible();
    expect(screen.getByTestId('test-icon')).toBeVisible();
  });

  it('should render subtitle when provided', () => {
    renderComponent({ subtitleLabel: 'Environment Group' });

    expect(screen.getByText('Environment Group')).toBeVisible();
  });

  it('should render description when provided', () => {
    renderComponent({ description: 'A test description' });

    expect(screen.getByText('A test description')).toBeVisible();
  });

  it('should render badge when provided', () => {
    renderComponent({ badge: <span>Multi-platform</span> });

    expect(screen.getByText('Multi-platform')).toBeVisible();
  });

  it('should render rightInfo when provided', () => {
    renderComponent({ rightInfo: <span>5 environments</span> });

    expect(screen.getByText('5 environments')).toBeVisible();
  });

  it('should render stat blocks supplied via rightInfo', () => {
    renderComponent({
      rightInfo: (
        <HeaderStats>
          <ResourceStatBlock>
            <ResourceStatBlock.Label>Sync Status</ResourceStatBlock.Label>
            <ResourceStatBlock.Value>Synced</ResourceStatBlock.Value>
          </ResourceStatBlock>
          <ResourceStatBlock>
            <ResourceStatBlock.Label>Health</ResourceStatBlock.Label>
            <ResourceStatBlock.Value>Healthy</ResourceStatBlock.Value>
          </ResourceStatBlock>
        </HeaderStats>
      ),
    });

    expect(screen.getByText('Sync Status')).toBeVisible();
    expect(screen.getByText('Synced')).toBeVisible();
    expect(screen.getByText('Health')).toBeVisible();
    expect(screen.getByText('Healthy')).toBeVisible();
  });

  it('should render the action bar segment when provided', () => {
    renderComponent({
      actionBar: (
        <>
          <span>Add Environment</span>
          <span>Delete</span>
        </>
      ),
    });

    expect(screen.getByText('Add Environment')).toBeVisible();
    expect(screen.getByText('Delete')).toBeVisible();
  });

  it('should not render the action bar segment when omitted', () => {
    renderComponent();

    expect(screen.queryByText('Add Environment')).not.toBeInTheDocument();
  });
});
