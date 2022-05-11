import { object, string, number, boolean } from 'yup';

import { validationSchema as accessControlSchema } from '@/portainer/access-control/AccessControlForm/AccessControlForm.validation';

import { validationSchema as portsSchema } from './PortsMappingField.validation';

export function validationSchema(isAdmin: boolean) {
  return object().shape({
    name: string().required('Name is required.'),
    image: string().required('Image is required.'),
    subscription: string().required('Subscription is required.'),
    resourceGroup: string().required('Resource group is required.'),
    location: string().required('Location is required.'),
    os: string().oneOf(['Linux', 'Windows']),
    cpu: number().positive(),
    memory: number().positive(),
    allocatePublicIP: boolean(),
    ports: portsSchema(),
    accessControl: accessControlSchema(isAdmin),
  });
}
