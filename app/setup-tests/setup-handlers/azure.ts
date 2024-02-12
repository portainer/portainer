import { http, HttpResponse } from 'msw';

export const azureHandlers = [
  http.get('/api/endpoints/:endpointId/azure/subscriptions', () =>
    HttpResponse.json({
      value: [
        {
          id: '/subscriptions/sub1',
          authorizationSource: 'RoleBased',
          subscriptionId: 'sub1',
          displayName: 'Portainer',
          state: 'Enabled',
        },
      ],
    })
  ),
  http.get(
    '/api/endpoints/:endpointId/azure/subscriptions/:subscriptionId/providers/Microsoft.ContainerInstance',
    ({ params }) =>
      HttpResponse.json({
        id: `/subscriptions/${params.subscriptionId}/providers/Microsoft.ContainerInstance`,
        namespace: 'Microsoft.ContainerInstance',
        resourceTypes: [
          {
            resourceType: 'containerGroups',
            locations: [
              'Australia East',
              'Australia Southeast',
              'Brazil South',
            ],
          },
          {
            resourceType: 'serviceAssociationLinks',
            locations: [
              'Korea Central',
              'North Central US',
              'North Europe',
              'Norway East',
              'South Africa North',
              'South Central US',
            ],
          },
          {
            resourceType: 'locations',
            locations: [],
          },
        ],
      })
  ),
  http.get(
    '/api/endpoints/:endpointId/azure/subscriptions/:subsriptionId/resourcegroups',
    ({ params }) =>
      HttpResponse.json({
        value: [
          {
            id: `/subscriptions/${params.subscriptionId}/resourceGroups/rg1`,
            name: 'rg1',
            location: 'southcentralus',
            properties: { provisioningState: 'Succeeded' },
          },
          {
            id: `/subscriptions/${params.subscriptionId}/resourceGroups/rg2`,
            name: 'rg2',
            location: 'southcentralus',
            properties: { provisioningState: 'Succeeded' },
          },
        ],
      })
  ),
];
