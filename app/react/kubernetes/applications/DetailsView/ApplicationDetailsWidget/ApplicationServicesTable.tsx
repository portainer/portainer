import { Service } from 'kubernetes-types/core/v1';
import { ExternalLink } from 'lucide-react';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { useEnvironment } from '@/react/portainer/environments/queries';

import { Icon } from '@@/Icon';
import { TextTip } from '@@/Tip/TextTip';

type Props = {
  environmentId: EnvironmentId;
  appServices?: Service[];
};

export function ApplicationServicesTable({
  environmentId,
  appServices,
}: Props) {
  const { data: environment } = useEnvironment(environmentId);
  return (
    <>
      <div className="text-muted mb-4 flex items-center">
        <Icon icon={ExternalLink} className="!mr-2" />
        Accessing the application
      </div>
      {appServices && appServices.length === 0 && (
        <TextTip color="blue" className="mb-4">
          This application is not exposing any port.
        </TextTip>
      )}
      {appServices && appServices.length > 0 && (
        <>
          <TextTip color="blue" className="mb-4">
            This application is exposed through service(s) as below:
          </TextTip>
          <table className="table">
            <tbody>
              <tr className="text-muted">
                <td className="w-[15%]">Service name</td>
                <td className="w-[10%]">Type</td>
                <td className="w-[10%]">Cluster IP</td>
                <td className="w-[10%]">External IP</td>
                <td className="w-[10%]">Container port</td>
                <td className="w-[15%]">Service port(s)</td>
              </tr>
              {appServices.map((service) => (
                <tr key={service.metadata?.name}>
                  <td>{service.metadata?.name}</td>
                  <td>{service.spec?.type}</td>
                  <td>{service.spec?.clusterIP}</td>
                  {service.spec?.type === 'LoadBalancer' && (
                    <td>
                      {service.status?.loadBalancer?.ingress?.[0] &&
                        service.spec?.ports?.[0] && (
                          <a
                            className="vertical-center hyperlink"
                            target="_blank"
                            rel="noopener noreferrer"
                            href={`http://${service.status.loadBalancer.ingress[0].ip}:${service.spec.ports[0].port}`}
                          >
                            <Icon icon={ExternalLink} className="!mr-1" />
                            <span data-cy="k8sAppDetail-containerPort">
                              Access
                            </span>
                          </a>
                        )}
                      {!service.status?.loadBalancer?.ingress && (
                        <div>
                          {service.spec.externalIPs?.[0]
                            ? service.spec.externalIPs[0]
                            : 'pending...'}
                        </div>
                      )}
                    </td>
                  )}
                  {service.spec?.type !== 'LoadBalancer' && (
                    <td>
                      {service.spec?.externalIPs?.[0]
                        ? service.spec.externalIPs[0]
                        : '-'}
                    </td>
                  )}
                  <td data-cy="k8sAppDetail-containerPort">
                    {service.spec?.ports?.map((port) => (
                      <div key={port.name}>{port.targetPort}</div>
                    ))}
                  </td>
                  <td>
                    {service.spec?.ports?.map((port) => (
                      <div key={port.name}>
                        {environment?.PublicURL && port.nodePort && (
                          <a
                            className="vertical-center hyperlink"
                            href={`http://${environment?.PublicURL}:${port.nodePort}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Icon icon={ExternalLink} className="!mr-1" />
                            <span data-cy="k8sAppDetail-containerPort">
                              {port.port}
                            </span>
                            <span>{port.nodePort ? ' : ' : ''}</span>
                            <span data-cy="k8sAppDetail-nodePort">
                              {port.nodePort}/{port.protocol}
                            </span>
                          </a>
                        )}
                        {!environment?.PublicURL && (
                          <div>
                            <span data-cy="k8sAppDetail-servicePort">
                              {port.port}
                            </span>
                            <span>{port.nodePort ? ' : ' : ''}</span>
                            <span data-cy="k8sAppDetail-nodePort">
                              {port.nodePort}/{port.protocol}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
