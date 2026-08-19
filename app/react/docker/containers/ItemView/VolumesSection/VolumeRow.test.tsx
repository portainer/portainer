import { render, screen } from '@testing-library/react';
import { MountPoint } from 'docker-types/generated/1.44';

import { withTestRouter } from '@/react/test-utils/withRouter';

import { VolumeRow } from './VolumeRow';

describe('VolumeRow', () => {
  it('should render bind mount with source path', () => {
    const volume: MountPoint = {
      Type: 'bind',
      Source: '/host/path',
      Destination: '/container/path',
      Mode: '',
      RW: true,
      Propagation: '',
    };

    renderComponent(volume);

    expect(screen.getByText('/host/path')).toBeVisible();
    expect(screen.getByText('/container/path')).toBeVisible();
  });

  it('should render volume mount with link to volume details', () => {
    const volume: MountPoint = {
      Type: 'volume',
      Name: 'my-volume',
      Source: '/var/lib/docker/volumes/my-volume/_data',
      Destination: '/data',
      Driver: 'local',
      Mode: '',
      RW: true,
      Propagation: '',
    };

    renderComponent(volume);

    const link = screen.getByText('my-volume');
    expect(link).toBeVisible();
    expect(link.tagName).toBe('A');
    expect(screen.getByText('/data')).toBeVisible();
  });

  it('should render tmpfs mount', () => {
    const volume: MountPoint = {
      Type: 'tmpfs',
      Source: '',
      Destination: '/tmp',
      Mode: '',
      RW: true,
      Propagation: '',
    };

    renderComponent(volume);

    expect(screen.getByText('/tmp')).toBeVisible();
  });

  it('should handle volume without name by showing source', () => {
    const volume: MountPoint = {
      Type: 'volume',
      Source: '/some/source',
      Destination: '/dest',
      Driver: 'local',
      Mode: '',
      RW: true,
      Propagation: '',
    };

    renderComponent(volume);

    expect(screen.getByText('/some/source')).toBeVisible();
    expect(screen.getByText('/dest')).toBeVisible();
  });
});

function renderComponent(volume: MountPoint) {
  const Wrapped = withTestRouter(() => (
    <table>
      <tbody>
        <VolumeRow volume={volume} nodeName="node1" />
      </tbody>
    </table>
  ));
  return render(<Wrapped />);
}
