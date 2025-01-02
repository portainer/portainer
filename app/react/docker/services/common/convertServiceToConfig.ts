import { Service } from 'docker-types/generated/1.41';

import { ServiceUpdateConfig } from '../types';

export function convertServiceToConfig(service: Service): ServiceUpdateConfig {
  return {
    Name: service.Spec?.Name || '',
    Labels: service.Spec?.Labels || {},
    TaskTemplate: service.Spec?.TaskTemplate || {},
    Mode: service.Spec?.Mode || {},
    UpdateConfig: service.Spec?.UpdateConfig || {},
    Networks: service.Spec?.Networks || [],
    EndpointSpec: service.Spec?.EndpointSpec || {},
  };
}
