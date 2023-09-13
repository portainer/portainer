import { List } from 'lucide-react';

import { joinCommand } from '@/docker/filters/utils';
import { getPairKey, getPairValue } from '@/portainer/filters/filters';

import { TableContainer, TableTitle } from '@@/datatables';
import { DetailsTable } from '@@/DetailsTable';

interface DockerImage {
  Command: null | Array<string>;
  Entrypoint: Array<string>;
  ExposedPorts: Array<number>;
  Volumes: Array<string>;
  Env: Array<string>;
}

interface Props {
  image: DockerImage;
}

export function DockerfileDetails({ image }: Props) {
  return (
    <TableContainer>
      <TableTitle label="Dockerfile details" icon={List} />
      <DetailsTable>
        <DetailsTable.Row label="CMD">
          <code>{image.Command ? joinCommand(image.Command) : '-'}</code>
        </DetailsTable.Row>

        {image.Entrypoint && (
          <DetailsTable.Row label="ENTRYPOINT">
            <code>{joinCommand(image.Entrypoint)}</code>
          </DetailsTable.Row>
        )}

        {image.ExposedPorts.length > 0 && (
          <DetailsTable.Row label="EXPOSE">
            {image.ExposedPorts.map((port, index) => (
              <span className="label label-default space-right" key={index}>
                {port}
              </span>
            ))}
          </DetailsTable.Row>
        )}

        {image.Volumes.length > 0 && (
          <DetailsTable.Row label="VOLUME">
            <div className="flex flex-wrap gap-1">
              {image.Volumes.map((volume, index) => (
                <span key={index} className="label label-default space-right">
                  {volume}
                </span>
              ))}
            </div>
          </DetailsTable.Row>
        )}

        {image.Env.length > 0 && (
          <DetailsTable.Row label="ENV">
            <table className="table-bordered table-condensed table">
              <tbody>
                {image.Env.map((variable) => (
                  <tr key={variable}>
                    <td>{getPairKey(variable, '=')}</td>
                    <td>{getPairValue(variable, '=')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DetailsTable.Row>
        )}
      </DetailsTable>
    </TableContainer>
  );
}
