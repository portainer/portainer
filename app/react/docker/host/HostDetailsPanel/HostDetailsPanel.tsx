import { useRouter } from '@uirouter/react';

import { humanize } from '@/portainer/filters/filters';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Widget } from '@@/Widget/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';
import { WidgetTitle } from '@@/Widget/WidgetTitle';
import { DetailsTable } from '@@/DetailsTable/DetailsTable';
import { Tooltip } from '@@/Tip/Tooltip';

import { DockerStorageInfo } from '../DockerStorageInfo';

type HostOs = {
  type: string;
  arch: string;
  name: string;
};

type HostInfo = {
  name: string;
  os?: HostOs;
  kernelVersion?: string;
  totalCPU: number;
  totalMemory: number;
};

type Props = {
  host: HostInfo;
  isBrowseEnabled: boolean;
  browseUrl: string;
  endpointId?: EnvironmentId;
};

export function HostDetailsPanel({
  host,
  isBrowseEnabled,
  browseUrl,
  endpointId,
}: Props) {
  const router = useRouter();

  return (
    <div className="row">
      <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
        <Widget>
          <WidgetTitle title="Host Details" icon="code" />
          <WidgetBody className="no-padding">
            <DetailsTable dataCy="host-details" className="!mb-0">
              <tr>
                <td>Hostname</td>
                <td>{host.name}</td>
              </tr>
              {host.os && (
                <tr>
                  <td>OS Information</td>
                  <td>
                    {host.os.type} {host.os.arch} {host.os.name}
                  </td>
                </tr>
              )}
              {host.kernelVersion && (
                <tr>
                  <td>Kernel Version</td>
                  <td>{host.kernelVersion}</td>
                </tr>
              )}
              <tr>
                <td>Total CPU</td>
                <td>{host.totalCPU}</td>
              </tr>
              <tr>
                <td>Total memory</td>
                <td>{humanize(host.totalMemory)}</td>
              </tr>
              {endpointId && (
                <tr>
                  <td>
                    <span className="flex items-center">
                      Disk usage
                      <Tooltip message="Disk usage on the partition backing Docker's data directory. Docker usage includes images, container layers, volumes, and build cache." />
                    </span>
                  </td>
                  <td>
                    <DockerStorageInfo endpointId={endpointId} />
                  </td>
                </tr>
              )}
              {isBrowseEnabled && (
                <tr>
                  <td colSpan={2}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      title="Browse"
                      onClick={() => router.stateService.go(browseUrl)}
                    >
                      Browse
                    </button>
                  </td>
                </tr>
              )}
            </DetailsTable>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
