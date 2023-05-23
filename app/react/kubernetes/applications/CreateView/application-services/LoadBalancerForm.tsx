import { FormikErrors } from 'formik';
import { ChangeEvent } from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';

import { useCurrentUser } from '@/react/hooks/useUser';

import { InputGroup } from '@@/form-components/InputGroup';
import { FormError } from '@@/form-components/FormError';
import { ButtonSelector } from '@@/form-components/ButtonSelector/ButtonSelector';
import { Button } from '@@/buttons';
import { Icon } from '@@/Icon';
import { Link } from '@@/Link';

import { isServicePortError, newPort } from './utils';
import { ContainerPortInput } from './ContainerPortInput';
import { ServicePortInput } from './ServicePortInput';
import { ServicePort } from './types';

interface Props {
  values: ServicePort[];
  onChange: (loadBalancerPorts: ServicePort[]) => void;
  loadBalancerEnabled: boolean;
  serviceName?: string;
  errors?: string | string[] | FormikErrors<ServicePort>[];
}

export function LoadBalancerForm({
  values: loadBalancerPorts,
  onChange,
  loadBalancerEnabled,
  serviceName,
  errors,
}: Props) {
  const newLoadBalancerPort = newPort(serviceName);
  const { isAdmin } = useCurrentUser();
  return (
    <>
      {isAdmin && !loadBalancerEnabled && (
        <div className="small">
          <p className="text-warning vertical-center mt-2">
            <Icon icon={AlertTriangle} mode="warning" /> No Load balancer is
            available in this cluster, click
            <Link
              to="kubernetes.cluster.setup"
              target="_blank"
              rel="noopener noreferrer"
            >
              here
            </Link>{' '}
            to configure load balancer.
          </p>
        </div>
      )}
      {!isAdmin && !loadBalancerEnabled && (
        <div className="small">
          <p className="text-warning vertical-center mt-2">
            <Icon icon={AlertTriangle} mode="warning" /> No Load balancer is
            available in this cluster, contact your administrator.
          </p>
        </div>
      )}
      {loadBalancerEnabled && (
        <>
          <div className="control-label !mb-2 !pt-0 text-left">
            Published ports
          </div>
          <div className="mb-2 flex flex-col gap-4">
            {loadBalancerPorts.map((lbPort, index) => {
              const error = errors?.[index];
              const servicePortError = isServicePortError<ServicePort>(error)
                ? error
                : undefined;

              return (
                <div key={index} className="flex flex-grow flex-wrap gap-2">
                  <div className="flex w-1/4 min-w-min flex-col">
                    <ContainerPortInput
                      index={index}
                      value={lbPort.targetPort}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const newServicePorts = [...loadBalancerPorts];
                        newServicePorts[index] = {
                          ...newServicePorts[index],
                          targetPort: Number(e.target.value),
                          port: Number(e.target.value),
                        };
                        onChange(newServicePorts);
                      }}
                    />
                    {servicePortError?.targetPort && (
                      <FormError>{servicePortError.targetPort}</FormError>
                    )}
                  </div>
                  <div className="flex w-1/4 min-w-min flex-col">
                    <ServicePortInput
                      index={index}
                      value={lbPort.port}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const newServicePorts = [...loadBalancerPorts];
                        newServicePorts[index] = {
                          ...newServicePorts[index],
                          port: Number(e.target.value),
                        };
                        onChange(newServicePorts);
                      }}
                    />
                    {servicePortError?.port && (
                      <FormError>{servicePortError.port}</FormError>
                    )}
                  </div>
                  <div className="flex w-1/4 min-w-min flex-col">
                    <InputGroup size="small">
                      <InputGroup.Addon required>
                        Loadbalancer port
                      </InputGroup.Addon>
                      <InputGroup.Input
                        type="number"
                        className="form-control min-w-max"
                        name={`loadbalancer_port_${index}`}
                        placeholder="80"
                        min="1"
                        max="65535"
                        value={lbPort.port || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const newServicePorts = [...loadBalancerPorts];
                          newServicePorts[index] = {
                            ...newServicePorts[index],
                            port: Number(e.target.value),
                          };
                          onChange(newServicePorts);
                        }}
                        required
                        data-cy={`k8sAppCreate-loadbalancerPort_${index}`}
                      />
                    </InputGroup>
                    {servicePortError?.nodePort && (
                      <FormError>{servicePortError.nodePort}</FormError>
                    )}
                  </div>

                  <ButtonSelector
                    className="h-[30px]"
                    onChange={(value) => {
                      const newServicePorts = [...loadBalancerPorts];
                      newServicePorts[index] = {
                        ...newServicePorts[index],
                        protocol: value,
                      };
                      onChange(newServicePorts);
                    }}
                    value={lbPort.protocol || 'TCP'}
                    options={[{ value: 'TCP' }, { value: 'UDP' }]}
                  />
                  <Button
                    disabled={loadBalancerPorts.length === 1}
                    size="small"
                    className="!ml-0 h-[30px]"
                    color="danger"
                    type="button"
                    onClick={() => {
                      // remove the port at the index in an immutable way
                      const newServicePorts = [
                        ...loadBalancerPorts.slice(0, index),
                        ...loadBalancerPorts.slice(index + 1),
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
                  const newServicesPorts = [
                    ...loadBalancerPorts,
                    newLoadBalancerPort,
                  ];
                  onChange(newServicesPorts);
                }}
              >
                Publish a new port
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
