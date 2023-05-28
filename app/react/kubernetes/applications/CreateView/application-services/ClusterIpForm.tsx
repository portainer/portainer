import { FormikErrors } from 'formik';
import { ChangeEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { FormError } from '@@/form-components/FormError';
import { ButtonSelector } from '@@/form-components/ButtonSelector/ButtonSelector';
import { Button } from '@@/buttons';

import { isServicePortError, newPort } from './utils';
import { ServicePort } from './types';
import { ServicePortInput } from './ServicePortInput';
import { ContainerPortInput } from './ContainerPortInput';

interface Props {
  values: ServicePort[];
  onChange: (servicePorts: ServicePort[]) => void;
  serviceName?: string;
  errors?: string | string[] | FormikErrors<ServicePort>[];
}

export function ClusterIpForm({
  values: servicePorts,
  onChange,
  errors,
  serviceName,
}: Props) {
  const newClusterIpPort = newPort(serviceName);
  return (
    <>
      <div className="control-label !mb-2 !pt-0 text-left">Published ports</div>
      <div className="mb-2 flex flex-col gap-4">
        {servicePorts.map((servicePort, index) => {
          const error = errors?.[index];
          const servicePortError = isServicePortError<ServicePort>(error)
            ? error
            : undefined;

          return (
            <div key={index} className="flex flex-grow flex-wrap gap-2">
              <div className="flex w-1/3 min-w-min flex-col">
                <ContainerPortInput
                  index={index}
                  value={servicePort.targetPort}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const newServicePorts = [...servicePorts];
                    const newValue =
                      e.target.value === ''
                        ? undefined
                        : Number(e.target.value);
                    newServicePorts[index] = {
                      ...newServicePorts[index],
                      targetPort: newValue,
                      port: newValue,
                    };
                    onChange(newServicePorts);
                  }}
                />
                {servicePortError?.targetPort && (
                  <FormError>{servicePortError.targetPort}</FormError>
                )}
              </div>

              <div className="flex w-1/3 min-w-min flex-col">
                <ServicePortInput
                  index={index}
                  value={servicePort.port}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const newServicePorts = [...servicePorts];
                    newServicePorts[index] = {
                      ...newServicePorts[index],
                      port:
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value),
                    };
                    onChange(newServicePorts);
                  }}
                />
                {servicePortError?.port && (
                  <FormError>{servicePortError.port}</FormError>
                )}
              </div>
              <ButtonSelector
                className="h-[30px]"
                onChange={(value) => {
                  const newServicePorts = [...servicePorts];
                  newServicePorts[index] = {
                    ...newServicePorts[index],
                    protocol: value,
                  };
                  onChange(newServicePorts);
                }}
                value={servicePort.protocol || 'TCP'}
                options={[{ value: 'TCP' }, { value: 'UDP' }]}
              />
              <Button
                disabled={servicePorts.length === 1}
                size="small"
                className="!ml-0 h-[30px]"
                color="danger"
                type="button"
                onClick={() => {
                  // remove the port at the index in an immutable way
                  const newServicePorts = [
                    ...servicePorts.slice(0, index),
                    ...servicePorts.slice(index + 1),
                  ];
                  onChange(newServicePorts);
                }}
                data-cy={`k8sAppCreate-rmPortButton_${index}`}
                icon={Trash2}
              />
            </div>
          );
        })}
        <div className="flex">
          <Button
            icon={Plus}
            color="default"
            className="!ml-0"
            onClick={() => {
              const newServicesPorts = [...servicePorts, newClusterIpPort];
              onChange(newServicesPorts);
            }}
          >
            Publish a new port
          </Button>
        </div>
      </div>
    </>
  );
}
