import { Plus, RefreshCw } from 'lucide-react';
import { FormikErrors } from 'formik';

import { useIsEdgeAdmin } from '@/react/hooks/useUser';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Card } from '@@/Card';
import { TextTip } from '@@/Tip/TextTip';
import { Button } from '@@/buttons';
import { FormError } from '@@/form-components/FormError';
import { Link } from '@@/Link';

import {
  generateUniqueName,
  newPort,
  serviceFormDefaultValues,
} from '../utils';
import { ServiceFormValues, ServicePort } from '../types';

import { LoadBalancerServiceForm } from './LoadBalancerServiceForm';

interface Props {
  services: ServiceFormValues[];
  onChangeService: (services: ServiceFormValues[]) => void;
  errors?: FormikErrors<ServiceFormValues[]>;
  appName: string;
  selector: Record<string, string>;
  namespace?: string;
  isEditMode?: boolean;
}

export function LoadBalancerServicesForm({
  services,
  onChangeService,
  errors,
  appName,
  selector,
  namespace,
  isEditMode,
}: Props) {
  const isAdminQuery = useIsEdgeAdmin();

  const environmentId = useEnvironmentId();
  const { data: loadBalancerEnabled, ...loadBalancerEnabledQuery } =
    useEnvironment(
      environmentId,
      (environment) => environment?.Kubernetes.Configuration.UseLoadBalancer
    );

  if (isAdminQuery.isLoading) {
    return null;
  }

  const { isAdmin } = isAdminQuery;

  const loadBalancerServiceCount = services.filter(
    (service) => service.Type === 'LoadBalancer'
  ).length;
  return (
    <Card className="pb-5">
      <div className="flex flex-col gap-6">
        <TextTip color="blue">
          Allow access to traffic <b>external</b> to the cluster via a{' '}
          <b>LoadBalancer service</b>. If running on a cloud platform, this auto
          provisions a cloud load balancer.
        </TextTip>
        {!loadBalancerEnabled && loadBalancerEnabledQuery.isSuccess && (
          <div className="flex flex-col">
            <FormError>
              {isAdmin ? (
                <>
                  Load balancer use is not currently enabled in this cluster.
                  Configure via{' '}
                  <Link
                    to="kubernetes.cluster.setup"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cy="k8sAppCreate-clusterSetupLink"
                  >
                    Cluster Setup
                  </Link>{' '}
                  and then refresh this tab
                </>
              ) : (
                'Load balancer use is not currently enabled in this cluster, contact your administrator.'
              )}
            </FormError>
            <div className="flex">
              <Button
                icon={RefreshCw}
                data-cy="k8sAppCreate-refreshLoadBalancerButton"
                color="default"
                className="!ml-0"
                onClick={() => loadBalancerEnabledQuery.refetch()}
              >
                Refresh
              </Button>
            </div>
          </div>
        )}
        {loadBalancerServiceCount > 0 && (
          <div className="flex w-full flex-col gap-4">
            {services.map((service, index) =>
              service.Type === 'LoadBalancer' ? (
                <LoadBalancerServiceForm
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
              newService.Type = 'LoadBalancer';
              const newServicePort = newPort(newService.Name);
              newService.Ports = [newServicePort];
              newService.Selector = selector;
              onChangeService([...services, newService]);
            }}
            disabled={!loadBalancerEnabled}
            data-cy="k8sAppCreate-createServiceButton"
          >
            Create service
          </Button>
        </div>
      </div>
    </Card>
  );
}
