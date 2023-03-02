import { number, object, SchemaOf, string } from 'yup';

import {
  edgeAsyncIntervalsValidation,
  EdgeAsyncIntervalsValues,
} from '@/react/edge/components/EdgeAsyncIntervalsForm';
import { gpusListValidation } from '@/react/portainer/environments/wizard/EnvironmentsCreationView/shared/Hardware/GpusList';
import { validation as urlValidation } from '@/react/portainer/common/PortainerTunnelAddrField';
import { validation as addressValidation } from '@/react/portainer/common/PortainerUrlField';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { metadataValidation } from '../../MetadataFieldset/validation';
import { useNameValidation } from '../../NameField';

import { FormValues } from './types';

export function useValidationSchema(asyncMode: boolean): SchemaOf<FormValues> {
  const nameValidation = useNameValidation();

  return object().shape({
    name: nameValidation,
    portainerUrl: urlValidation(),
    tunnelServerAddr: asyncMode ? string() : addressValidation(),
    pollFrequency: number().required(),
    meta: metadataValidation(),
    gpus: gpusListValidation(),
    edge: isBE
      ? edgeAsyncIntervalsValidation()
      : (null as unknown as SchemaOf<EdgeAsyncIntervalsValues>),
  });
}
