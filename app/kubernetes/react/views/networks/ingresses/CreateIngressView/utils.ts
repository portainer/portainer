import { v4 as uuidv4 } from 'uuid';

import { Annotation } from '@/kubernetes/react/views/networks/ingresses/components/annotations/types';

import { TLS, Ingress } from '../types';

import { Host, Rule } from './types';

const ignoreAnnotationsForEdit = [
  'kubectl.kubernetes.io/last-applied-configuration',
];

export function prepareTLS(hosts: Host[]) {
  const tls: TLS[] = [];
  hosts.forEach((host) => {
    if (host.Secret && host.Host) {
      tls.push({
        Hosts: [host.Host],
        SecretName: host.Secret,
      });
    }
  });
  return tls;
}

export function preparePaths(ingressName: string, hosts: Host[]) {
  return hosts.flatMap((host) =>
    host.Paths.map((p) => ({
      ServiceName: p.ServiceName,
      Host: host.Host,
      Path: p.Route,
      Port: p.ServicePort,
      PathType: p.PathType || 'Prefix',
      IngressName: ingressName,
    }))
  );
}

export function prepareAnnotations(annotations: Annotation[]) {
  const result: Record<string, string> = {};
  annotations.forEach((a) => {
    result[a.Key] = a.Value;
  });
  return result;
}

function getSecretByHost(host: string, tls?: TLS[]) {
  let secret = '';
  if (tls) {
    tls.forEach((t) => {
      if (t.Hosts.indexOf(host) !== -1) {
        secret = t.SecretName;
      }
    });
  }
  return secret;
}

export function prepareRuleHostsFromIngress(ing: Ingress) {
  const hosts = ing.Hosts?.map((host) => {
    const h: Host = {} as Host;
    h.Host = host;
    h.Secret = getSecretByHost(host, ing.TLS);
    h.Paths = [];
    ing.Paths.forEach((path) => {
      if (path.Host === host) {
        h.Paths.push({
          Route: path.Path,
          ServiceName: path.ServiceName,
          ServicePort: path.Port,
          PathType: path.PathType,
          Key: Math.random().toString(),
        });
      }
    });
    if (!host) {
      h.NoHost = true;
    }
    h.Key = uuidv4();
    return h;
  });

  return hosts;
}

export function getAnnotationsForEdit(
  annotations: Record<string, string>
): Annotation[] {
  const result: Annotation[] = [];
  Object.keys(annotations).forEach((k) => {
    if (ignoreAnnotationsForEdit.indexOf(k) === -1) {
      result.push({
        Key: k,
        Value: annotations[k],
        ID: uuidv4(),
      });
    }
  });
  return result;
}

export function prepareRuleFromIngress(ing: Ingress): Rule {
  return {
    Key: uuidv4(),
    IngressName: ing.Name,
    Namespace: ing.Namespace,
    IngressClassName: ing.ClassName,
    Hosts: prepareRuleHostsFromIngress(ing) || [],
    Annotations: ing.Annotations ? getAnnotationsForEdit(ing.Annotations) : [],
    IngressType: ing.Type,
  };
}

export function checkIfPathExistsWithHost(
  ingresses: Ingress[],
  host: string,
  path: string,
  ingressName?: string
) {
  let exists = false;
  ingresses.forEach((ingress) => {
    if (ingressName && ingress.Name === ingressName) {
      return;
    }
    ingress.Paths?.forEach((p) => {
      if (p.Host === host && p.Path === path) {
        exists = true;
      }
    });
  });
  return exists;
}
