import { FormikErrors } from 'formik';
import { Plus } from 'lucide-react';

import { KubernetesApplicationPublishingTypes } from '@/kubernetes/models/application/models';

import { Card } from '@@/Card';
import { TextTip } from '@@/Tip/TextTip';
import { Button } from '@@/buttons';

import {
  serviceFormDefaultValues,
  generateUniqueName,
  newPort,
} from '../utils';
import { ServiceFormValues, ServicePort } from '../types';

import { NodePortServiceForm } from './NodePortServiceForm';

interface Props {
  services: ServiceFormValues[];
  onChangeService: (services: ServiceFormValues[]) => void;
  errors?: FormikErrors<ServiceFormValues[]>;
  appName: string;
  selector: Record<string, string>;
  namespace?: string;
  isEditMode?: boolean;
}

export function NodePortServicesForm({
  services,
  onChangeService,
  errors,
  appName,
  selector,
  namespace,
  isEditMode,
}: Props) {
  const nodePortServiceCount = services.filter(
    (service) => service.Type === KubernetesApplicationPublishingTypes.NODE_PORT
  ).length;
  return (
    <Card className="pb-5">
      <div className="flex flex-col gap-6">
        <TextTip color="blue">
          Allow access to traffic <b>external</b> to the cluster via a{' '}
          <b>NodePort service</b>. Not generally recommended for Production use.
        </TextTip>
        {nodePortServiceCount > 0 && (
          <div className="flex w-full flex-col gap-4">
            {services.map((service, index) =>
              service.Type ===
              KubernetesApplicationPublishingTypes.NODE_PORT ? (
                <NodePortServiceForm
                  key={index}
                  serviceName={service.Name}
                  servicePorts={service.Ports}
                  errors={errors?.[index]?.Ports}
                  onChangePort={(servicePorts: ServicePort[]) => {
                    const newServices = [...services];
                    newServices[index].Ports = servicePorts;
                    onChangeService(newServices);
                  }}
                  services={services}
                  serviceIndex={index}
                  onChangeService={onChangeService}
                  namespace={namespace}
                  isEditMode={isEditMode}
                />
              ) : null
            )}
          </div>
        )}
        <div className="flex">
          <Button
            color="secondary"
            className="!ml-0"
            icon={Plus}
            size="small"
            onClick={() => {
              // create a new service form value and add it to the list of services
              const newService = structuredClone(serviceFormDefaultValues);
              newService.Name = generateUniqueName(
                appName,
                services.length + 1,
                services
              );
              newService.Type = KubernetesApplicationPublishingTypes.NODE_PORT;
              const newServicePort = newPort(newService.Name);
              newService.Ports = [newServicePort];
              newService.Selector = selector;
              onChangeService([...services, newService]);
            }}
            data-cy="k8sAppCreate-createServiceButton"
          >
            Create service
          </Button>
        </div>
      </div>
    </Card>
  );
}
