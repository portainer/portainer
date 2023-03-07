import { number, object, SchemaOf, string } from 'yup';

import {
  edgeAsyncIntervalsValidation,
  EdgeAsyncIntervalsValues,
} from '@/react/edge/components/EdgeAsyncIntervalsForm';
import { validation as urlValidation } from '@/react/portainer/common/PortainerTunnelAddrField';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { metadataValidation } from '../../MetadataFieldset/validation';
import { useNameValidation } from '../../NameField';

import { FormValues } from './types';

export function useValidationSchema(): SchemaOf<FormValues> {
  const nameValidation = useNameValidation();

  return object().shape({
    name: nameValidation,
    portainerUrl: urlValidation(),
    tunnelServerAddr: string(),
    pollFrequency: number().required(),
    meta: metadataValidation(),
    edge: isBE
      ? edgeAsyncIntervalsValidation()
      : (null as unknown as SchemaOf<EdgeAsyncIntervalsValues>),
  });
}
