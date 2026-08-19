import { render, screen } from '@testing-library/react';
import { MountPoint } from 'docker-types/generated/1.44';

import { withTestRouter } from '@/react/test-utils/withRouter';

import { VolumesSection } from './VolumesSection';

describe('VolumesSection', () => {
  it('should render volumes table with correct headers', () => {
    const volumes: Array<MountPoint> = [
      {
        Type: 'volume',
        Name: 'test-volume',
        Source: '/var/lib/docker/volumes/test-volume/_data',
        Destination: '/data',
        Driver: 'local',
        Mode: '',
        RW: true,
        Propagation: '',
      },
    ];

    renderComponent(volumes);

    const table = screen.getByRole('table');
    expect(table).toBeVisible();
    expect(table).toHaveAttribute('data-cy', 'containerDetails-volumesTable');
    expect(screen.getByText('Host/volume')).toBeVisible();
    expect(screen.getByText('Path in container')).toBeVisible();
  });

  it('should render multiple volumes', () => {
    const volumes: Array<MountPoint> = [
      {
        Type: 'volume',
        Name: 'volume1',
        Source: '/var/lib/docker/volumes/volume1/_data',
        Destination: '/data1',
        Driver: 'local',
        Mode: '',
        RW: true,
        Propagation: '',
      },
      {
        Type: 'bind',
        Source: '/host/path',
        Destination: '/container/path',
        Mode: '',
        RW: false,
        Propagation: '',
      },
    ];

    renderComponent(volumes);

    expect(screen.getByText('volume1')).toBeVisible();
    expect(screen.getByText('/host/path')).toBeVisible();
    expect(screen.getByText('/data1')).toBeVisible();
    expect(screen.getByText('/container/path')).toBeVisible();
  });

  it('should not render when volumes array is empty', () => {
    renderComponent([]);

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText('Volumes')).not.toBeInTheDocument();
  });

  it('should not render when volumes is undefined', () => {
    const Wrapped = withTestRouter(VolumesSection);
    render(<Wrapped volumes={undefined as unknown as Array<MountPoint>} />);

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText('Volumes')).not.toBeInTheDocument();
  });
});

function renderComponent(volumes: Array<MountPoint>) {
  const Wrapped = withTestRouter(VolumesSection);
  return render(<Wrapped volumes={volumes} nodeName="node1" />);
}
