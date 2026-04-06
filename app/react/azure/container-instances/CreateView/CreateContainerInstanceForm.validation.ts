import { object, string, number, boolean, array } from 'yup';

import i18n from '@/i18n';
import { validationSchema as accessControlSchema } from '@/react/portainer/access-control/AccessControlForm/AccessControlForm.validation';

import { buildUniquenessTest } from '@@/form-components/validate-unique';

import { validationSchema as portsSchema } from './PortsMappingField.validation';

export function validationSchema(isAdmin: boolean) {
  return object().shape({
    name: string().required(i18n.t('validation.name_required')),
    image: string().required(i18n.t('validation.image_required')),
    subscription: string().required(i18n.t('validation.subscription_required')),
    resourceGroup: string().required(
      i18n.t('validation.resource_group_required')
    ),
    location: string().required(i18n.t('validation.location_required')),
    os: string().oneOf(['Linux', 'Windows']),
    cpu: number().positive(),
    memory: number().positive(),
    allocatePublicIP: boolean(),
    ports: portsSchema(),
    accessControl: accessControlSchema(isAdmin),
    env: array()
      .of(
        object().shape({
          name: string().required(i18n.t('validation.env_var_name_required')),
          value: string().required(
            i18n.t('validation.env_var_value_required')
          ),
        })
      )
      .test(
        'unique',
        i18n.t('validation.env_var_already_defined'),
        buildUniquenessTest(
          () => i18n.t('validation.env_var_already_defined'),
          'name'
        )
      ),
  });
}
