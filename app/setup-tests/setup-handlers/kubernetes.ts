import { NodeList } from 'kubernetes-types/core/v1';
import { http, HttpResponse } from 'msw';

export const kubernetesHandlers = [
  http.get(
    '/api/kubernetes/:endpointId/metrics/pods/namespace/:namespace',
    () => HttpResponse.json({})
  ),
  http.get('/api/kubernetes/:endpointId/namespaces/:namespace/events', () =>
    HttpResponse.json([])
  ),
  http.get('/api/kubernetes/:endpointId/namespaces/:namespace', () =>
    HttpResponse.json({})
  ),
  http.get('/api/kubernetes/:endpointId/ingresses', () =>
    HttpResponse.json({})
  ),
  http.get('/api/kubernetes/:endpointId/namespaces', () =>
    HttpResponse.json([])
  ),
  http.get('/api/kubernetes/:endpointId/customresourcedefinitions', () =>
    HttpResponse.json({})
  ),
  http.get('/api/kubernetes/:endpointId/rbac_enabled', () =>
    HttpResponse.json(false)
  ),
  http.get('/api/kubernetes/:endpointId/customresourcedefinitions/:name', () =>
    HttpResponse.json({})
  ),
  http.get(
    '/api/kubernetes/:endpointId/namespaces/portainer/configmaps/:name',
    () => HttpResponse.json({})
  ),
  http.get('/api/kubernetes/:endpointId/max_resource_limits', () =>
    HttpResponse.json({})
  ),
  http.get('/api/kubernetes/:endpointId/ingresscontrollers', () =>
    HttpResponse.json([])
  ),
  http.get('/api/kubernetes/:id/namespaces/:ns/ingresscontrollers', () =>
    HttpResponse.json([])
  ),

  http.get('/api/endpoints/:endpointId/kubernetes/api/v1/nodes', () =>
    HttpResponse.json({ items: [] } satisfies NodeList)
  ),
];
