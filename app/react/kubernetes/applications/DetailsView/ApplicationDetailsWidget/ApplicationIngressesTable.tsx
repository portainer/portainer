import { Service } from 'kubernetes-types/core/v1';
import { useMemo } from 'react';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { useIngresses } from '@/react/kubernetes/ingresses/queries';
import { Ingress } from '@/react/kubernetes/ingresses/types';
import { Authorized } from '@/react/hooks/useUser';

import { Link } from '@@/Link';

type Props = {
  environmentId: EnvironmentId;
  namespace: string;
  appServices?: Service[];
};

export function ApplicationIngressesTable({
  environmentId,
  namespace,
  appServices,
}: Props) {
  const namespaceIngresses = useIngresses(environmentId, [namespace]);
  // getIngressPathsForAppServices could be expensive, so memoize it
  const ingressPathsForAppServices = useMemo(
    () => getIngressPathsForAppServices(namespaceIngresses.data, appServices),
    [namespaceIngresses.data, appServices]
  );

  if (!ingressPathsForAppServices.length) {
    return null;
  }

  return (
    <table className="mt-4 table">
      <tbody>
        <tr className="text-muted">
          <td className="w-[15%]">Ingress name</td>
          <td className="w-[10%]">Service name</td>
          <td className="w-[10%]">Host</td>
          <td className="w-[10%]">Port</td>
          <td className="w-[10%]">Path</td>
          <td className="w-[15%]">HTTP Route</td>
        </tr>
        {ingressPathsForAppServices?.map((ingressPath, index) => (
          <tr key={index}>
            <td>
              <Authorized authorizations="K8sIngressesW">
                <Link
                  to="kubernetes.ingresses.edit"
                  params={{ name: ingressPath.ingressName, namespace }}
                >
                  {ingressPath.ingressName}
                </Link>
              </Authorized>
            </td>
            <td>{ingressPath.serviceName}</td>
            <td>{ingressPath.host}</td>
            <td>{ingressPath.port}</td>
            <td>{ingressPath.path}</td>
            <td>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`${ingressPath.secure ? 'https' : 'http'}://${
                  ingressPath.host
                }${ingressPath.path}`}
              >
                {ingressPath.host}
                {ingressPath.path}
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type IngressPath = {
  ingressName: string;
  serviceName: string;
  port: number;
  secure: boolean;
  host: string;
  path: string;
};

function getIngressPathsForAppServices(
  ingresses?: Ingress[],
  services?: Service[]
): IngressPath[] {
  if (!ingresses || !services) {
    return [];
  }
  const matchingIngressesPaths = ingresses.flatMap((ingress) => {
    // for each ingress get an array of ingress paths that match the app services
    if (!ingress.Paths) {
      return [];
    }
    const matchingIngressPaths = ingress.Paths?.filter((path) =>
      services?.some((service) => {
        const servicePorts = service.spec?.ports?.map((port) => port.port);
        // include the ingress if the ingress path has a matching service name and port
        return (
          path.ServiceName === service.metadata?.name &&
          servicePorts?.includes(path.Port)
        );
      })
    ).map((path) => {
      const secure =
        (ingress.TLS &&
          ingress.TLS.filter(
            (tls) => tls.Hosts && tls.Hosts.includes(path.Host)
          ).length > 0) ??
        false;
      return {
        ingressName: ingress.Name,
        serviceName: path.ServiceName,
        port: path.Port,
        secure,
        host: path.Host,
        path: path.Path,
      };
    });
    return matchingIngressPaths;
  });
  return matchingIngressesPaths;
}
