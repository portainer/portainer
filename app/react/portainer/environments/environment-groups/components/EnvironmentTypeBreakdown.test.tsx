import { render, screen } from '@testing-library/react';

import { EnvironmentGroup } from '../types';

import { EnvironmentTypeBreakdown } from './EnvironmentTypeBreakdown';

function buildGroup(
  overrides: Partial<EnvironmentGroup> = {}
): EnvironmentGroup {
  return {
    Id: 2,
    Name: 'test-group',
    Description: '',
    TagIds: [],
    ...overrides,
  };
}

describe('EnvironmentTypeBreakdown', () => {
  it('renders nothing when Total is 0', () => {
    const { container } = render(
      <EnvironmentTypeBreakdown group={buildGroup({ Total: 0 })} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when Total is undefined', () => {
    const { container } = render(
      <EnvironmentTypeBreakdown group={buildGroup()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders singular environment count when TypeInfo is absent', () => {
    render(<EnvironmentTypeBreakdown group={buildGroup({ Total: 1 })} />);
    expect(screen.getByText('1 Environment')).toBeInTheDocument();
  });

  it('renders plural environment count when TypeInfo is absent', () => {
    render(<EnvironmentTypeBreakdown group={buildGroup({ Total: 5 })} />);
    expect(screen.getByText('5 Environments')).toBeInTheDocument();
  });

  it('applies data-cy attribute using group name', () => {
    render(<EnvironmentTypeBreakdown group={buildGroup({ Total: 3 })} />);
    expect(
      screen.getByTestId('environment-group-size_test-group')
    ).toBeInTheDocument();
  });

  it('renders Kubernetes logo and count', () => {
    render(
      <EnvironmentTypeBreakdown
        group={buildGroup({
          Total: 2,
          TypeInfo: { Kubernetes: 2, Docker: 0, Podman: 0, Mixed: false },
        })}
      />
    );
    expect(screen.getByAltText('Kubernetes')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.queryByAltText('Docker')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Podman')).not.toBeInTheDocument();
  });

  it('renders Docker logo and count', () => {
    render(
      <EnvironmentTypeBreakdown
        group={buildGroup({
          Total: 3,
          TypeInfo: { Kubernetes: 0, Docker: 3, Podman: 0, Mixed: false },
        })}
      />
    );
    expect(screen.getByAltText('Docker')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByAltText('Kubernetes')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Podman')).not.toBeInTheDocument();
  });

  it('renders Podman logo and count', () => {
    render(
      <EnvironmentTypeBreakdown
        group={buildGroup({
          Total: 1,
          TypeInfo: { Kubernetes: 0, Docker: 0, Podman: 1, Mixed: true },
        })}
      />
    );
    expect(screen.getByAltText('Podman')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.queryByAltText('Kubernetes')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Docker')).not.toBeInTheDocument();
  });

  it('renders all three logos when all platform types are present', () => {
    render(
      <EnvironmentTypeBreakdown
        group={buildGroup({
          Total: 6,
          TypeInfo: { Kubernetes: 2, Docker: 3, Podman: 1, Mixed: true },
        })}
      />
    );
    expect(screen.getByAltText('Kubernetes')).toBeInTheDocument();
    expect(screen.getByAltText('Docker')).toBeInTheDocument();
    expect(screen.getByAltText('Podman')).toBeInTheDocument();
  });
});
