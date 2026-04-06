import { mixed, object, SchemaOf, string } from 'yup';

import i18n from '@/i18n';
import { CreateAgentEnvironmentValues } from '@/react/portainer/environments/environment.service/create';
import { useNameValidation } from '@/react/portainer/environments/common/NameField/NameField';
import { metadataValidation } from '@/react/portainer/environments/common/MetadataFieldset/validation';

export function useValidation(): SchemaOf<CreateAgentEnvironmentValues> {
  return object({
    name: useNameValidation(),
    environmentUrl: environmentValidation(),
    meta: metadataValidation(),
    containerEngine: mixed().oneOf(['docker', 'podman']),
  });
}

function environmentValidation() {
  return string()
    .required(i18n.t('validation.field_required'))
    .test(
      'address',
      i18n.t('validation.env_address_format'),
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
