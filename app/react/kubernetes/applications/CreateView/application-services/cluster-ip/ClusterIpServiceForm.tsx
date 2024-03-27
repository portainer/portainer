import { FormikErrors } from 'formik';
import { ChangeEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { FormError } from '@@/form-components/FormError';
import { ButtonSelector } from '@@/form-components/ButtonSelector/ButtonSelector';
import { Button } from '@@/buttons';
import { Card } from '@@/Card';
import { Widget } from '@@/Widget';
import { isErrorType } from '@@/form-components/formikUtils';

import { newPort } from '../utils';
import {
  ServiceFormValues,
  ServicePort,
  ServicePortIngressPath,
} from '../types';
import { ContainerPortInput } from '../components/ContainerPortInput';
import { ServicePortInput } from '../components/ServicePortInput';
import { AppIngressPathsForm } from '../ingress/AppIngressPathsForm';

interface Props {
  services: ServiceFormValues[];
  serviceIndex: number;
  onChangeService: (services: ServiceFormValues[]) => void;
  servicePorts: ServicePort[];
  onChangePort: (servicePorts: ServicePort[]) => void;
  serviceName?: string;
  errors?: string | string[] | FormikErrors<ServicePort>[];
  namespace?: string;
  isEditMode?: boolean;
}

export function ClusterIpServiceForm({
  services,
  serviceIndex,
  onChangeService,
  servicePorts,
  onChangePort,
  errors,
  serviceName,
  namespace,
  isEditMode,
}: Props) {
  const newClusterIpPort = newPort(serviceName);
  return (
    <Widget key={serviceIndex}>
      <Widget.Body>
        <div className="flex justify-between">
          <div className="text-muted vertical-center">ClusterIP</div>
          <Button
            icon={Trash2}
            data-cy={`remove-service_${serviceIndex}`}
            color="dangerlight"
            className="!ml-0"
            onClick={() => {
              // remove the service at index in an immutable way
              const newServices = [
                ...services.slice(0, serviceIndex),
                ...services.slice(serviceIndex + 1),
              ];
              onChangeService(newServices);
            }}
          >
            Remove service
          </Button>
        </div>
        <div className="control-label !mb-2 !pt-0 text-left">Ports</div>
        <div className="flex flex-col gap-3">
          {servicePorts.map((servicePort, portIndex) => {
            const error = errors?.[portIndex];
            const servicePortErrors = isErrorType<ServicePort>(error)
              ? error
              : undefined;
            const ingressPathsErrors = isErrorType<ServicePortIngressPath[]>(
              servicePortErrors?.ingressPaths
            )
              ? servicePortErrors?.ingressPaths
              : undefined;

            return (
              <Card key={portIndex} className="flex flex-col gap-y-3">
                <div className="flex flex-grow flex-wrap justify-between gap-x-4 gap-y-1">
                  <div className="inline-flex min-w-min flex-grow basis-3/4 flex-wrap gap-x-4 gap-y-1">
                    <div className="flex min-w-min basis-1/3 flex-col">
                      <ContainerPortInput
                        serviceIndex={serviceIndex}
                        portIndex={portIndex}
                        value={servicePort.targetPort}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const newServicePorts = [...servicePorts];
                          const newValue = e.target.valueAsNumber;
                          newServicePorts[portIndex] = {
                            ...newServicePorts[portIndex],
                            targetPort: newValue,
                            port: newValue,
                          };
                          onChangePort(newServicePorts);
                        }}
                      />
                      {servicePortErrors?.targetPort && (
                        <FormError>{servicePortErrors.targetPort}</FormError>
                      )}
                    </div>
                    <div className="flex min-w-min basis-1/3 flex-col">
                      <ServicePortInput
                        serviceIndex={serviceIndex}
                        portIndex={portIndex}
                        value={servicePort.port}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const newServicePorts = [...servicePorts];
                          newServicePorts[portIndex] = {
                            ...newServicePorts[portIndex],
                            port: e.target.valueAsNumber,
                          };
                          onChangePort(newServicePorts);
                        }}
                      />
                      {servicePortErrors?.port && (
                        <FormError>{servicePortErrors.port}</FormError>
                      )}
                    </div>
                    <ButtonSelector
                      className="h-[30px]"
                      onChange={(value) => {
                        const newServicePorts = [...servicePorts];
                        newServicePorts[portIndex] = {
                          ...newServicePorts[portIndex],
                          protocol: value,
                        };
                        onChangePort(newServicePorts);
                      }}
                      value={servicePort.protocol || 'TCP'}
                      options={[{ value: 'TCP' }, { value: 'UDP' }]}
                    />
                  </div>
                  <Button
                    disabled={servicePorts.length === 1}
                    size="small"
                    className="!ml-0 h-[30px]"
                    color="dangerlight"
                    type="button"
                    onClick={() => {
                      // remove the port at the index in an immutable way
                      const newServicePorts = [
                        ...servicePorts.slice(0, portIndex),
                        ...servicePorts.slice(portIndex + 1),
                      ];
                      onChangePort(newServicePorts);
                    }}
                    data-cy={`k8sAppCreate-rmPortButton-${serviceIndex}-${portIndex}`}
                    icon={Trash2}
                  >
                    Remove port
                  </Button>
                </div>
                <AppIngressPathsForm
                  servicePortIngressPaths={servicePorts[portIndex].ingressPaths}
                  onChangeIngressPaths={(
                    ingressPaths?: ServicePortIngressPath[]
                  ) => {
                    const newServicePorts = [...servicePorts];
                    newServicePorts[portIndex].ingressPaths = ingressPaths;
                    onChangePort(newServicePorts);
                  }}
                  namespace={namespace}
                  ingressPathsErrors={ingressPathsErrors}
                  serviceIndex={serviceIndex}
                  portIndex={portIndex}
                  isEditMode={isEditMode}
                />
              </Card>
            );
          })}
          <div className="flex">
            <Button
              icon={Plus}
              data-cy={`add-port_${serviceIndex}`}
              color="default"
              className="!ml-0"
              onClick={() => {
                const newServicesPorts = [...servicePorts, newClusterIpPort];
                onChangePort(newServicesPorts);
              }}
            >
              Add port
            </Button>
          </div>
        </div>
      </Widget.Body>
    </Widget>
  );
}
