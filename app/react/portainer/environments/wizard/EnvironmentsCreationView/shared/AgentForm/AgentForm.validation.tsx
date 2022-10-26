import { object, SchemaOf, string } from 'yup';

import { gpusListValidation } from '@/react/portainer/environments/wizard/EnvironmentsCreationView/shared/Hardware/GpusList';
import { CreateAgentEnvironmentValues } from '@/react/portainer/environments/environment.service/create';

import { metadataValidation } from '../MetadataFieldset/validation';
import { nameValidation } from '../NameField';

export function validation(): SchemaOf<CreateAgentEnvironmentValues> {
  return object({
    name: nameValidation(),
    environmentUrl: environmentValidation(),
    meta: metadataValidation(),
    gpus: gpusListValidation(),
  });
}

function environmentValidation() {
  return string()
    .required('This field is required')
    .test(
      'address',
      'Environment address must be of the form <IP>:<PORT> or <HOST>:<PORT>.',
      (environmentUrl) => validateAddress(environmentUrl)
    );
}

export function validateAddress(address: string | undefined) {
  if (typeof address === 'undefined') {
    return false;
  }

  if (address.indexOf('://') > -1) {
    return false;
  }

  const [host, port] = address.split(':');

  if (
    host.length === 0 ||
    Number.isNaN(parseInt(port, 10)) ||
    port.match(/^[0-9]+$/) == null ||
    parseInt(port, 10) < 1 ||
    parseInt(port, 10) > 65535
  ) {
    return false;
  }

  return true;
}
