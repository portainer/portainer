import { useMemo } from 'react';

import { GenericResource } from '@/react/kubernetes/helm/types';

import { StatusBadgeType } from '@@/StatusBadge';

import { ResourceLink, ResourceRow } from './types';

// from defined routes in app/kubernetes/__module.js
const kindToUrlMap = {
  Deployment: 'kubernetes.applications.application',
  DaemonSet: 'kubernetes.applications.application',
  StatefulSet: 'kubernetes.applications.application',
  Pod: 'kubernetes.applications.application',
  Ingress: 'kubernetes.ingresses',
  ConfigMap: 'kubernetes.configmaps.configmap',
  Secret: 'kubernetes.secrets.secret',
  PersistentVolumeClaim: 'kubernetes.volumes.volume',
};

const statusToColorMap: Record<string, StatusBadgeType> = {
  Healthy: 'success',
  Progressing: 'warning',
  Degraded: 'danger',
  Failed: 'danger',
  Unhealthy: 'danger',
  Unknown: 'mutedLite',
};

export function useResourceRows(resources?: GenericResource[]): ResourceRow[] {
  return useMemo(() => getResourceRows(resources), [resources]);
}

function getResourceRows(resources?: GenericResource[]): ResourceRow[] {
  if (!resources) {
    return [];
  }

  return resources.map(getResourceRow);
}

function getResourceRow(resource: GenericResource): ResourceRow {
  const {
    reason = '',
    status = '',
    message = '',
  } = resource.status.healthSummary || {};

  return {
    id: `${resource.kind}/${resource.metadata.name}/${resource.metadata.namespace}`,
    name: {
      label: resource.metadata.name,
      link: getResourceLink(resource),
    },
    resourceType: resource.kind ?? '-',
    describe: {
      name: resource.metadata.name,
      namespace: resource.metadata.namespace,
      resourceType: resource.kind,
    },
    status: {
      label: reason ?? 'Unknown',
      type: statusToColorMap[status] ?? 'default',
    },
    statusMessage: message ?? '-',
  };
}

function getResourceLink(resource: GenericResource): ResourceLink | null {
  const { namespace, name } = resource.metadata;

  const to = kindToUrlMap[resource.kind as keyof typeof kindToUrlMap];

  // If the resource kind is not supported, return null
  if (!to) {
    return null;
  }

  // If the resource is not namespaced, return the link to the resource with the name only
  if (!namespace) {
    return {
      to,
      params: {
        name,
      },
    };
  }

  // If the resource is namespaced, return the link to the resource with the namespace and name
  return {
    to,
    params: {
      namespace,
      name,
    },
  };
}
