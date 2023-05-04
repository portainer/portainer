import { boolean, object, SchemaOf, string } from 'yup';

import { validation as tunnelValidation } from '@/react/portainer/common/PortainerTunnelAddrField';
import { validation as urlValidation } from '@/react/portainer/common/PortainerUrlField';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { FormValues } from './types';

export function validationSchema(): SchemaOf<FormValues> {
  return object()
    .shape({
      EnableEdgeComputeFeatures: boolean().required('This field is required.'),
      EnforceEdgeID: boolean().required('This field is required.'),
    })
    .concat(
      isBE
        ? object({
            EdgePortainerUrl: urlValidation(),
            Edge: object({
              TunnelServerAddress: tunnelValidation(),
            }),
          })
        : object({
            EdgePortainerUrl: string().default(''),
            Edge: object({
              TunnelServerAddress: string().default(''),
            }),
          })
    );
}
