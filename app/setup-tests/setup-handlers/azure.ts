import { rest } from 'msw';

export const azureHandlers = [
  rest.get('/api/endpoints/:endpointId/azure/subscriptions', (req, res, ctx) =>
    res(
      ctx.json({
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
    )
  ),
  rest.get(
    '/api/endpoints/:endpointId/azure/subscriptions/:subscriptionId/providers/Microsoft.ContainerInstance',
    (req, res, ctx) =>
      res(
        ctx.json({
          id: `/subscriptions/${req.params.subscriptionId}/providers/Microsoft.ContainerInstance`,
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
      )
  ),
  rest.get(
    '/api/endpoints/:endpointId/azure/subscriptions/:subsriptionId/resourcegroups',
    (res, req, ctx) =>
      req(
        ctx.json({
          value: [
            {
              id: `/subscriptions/${res.params.subscriptionId}/resourceGroups/rg1`,
              name: 'rg1',
              location: 'southcentralus',
              properties: { provisioningState: 'Succeeded' },
            },
            {
              id: `/subscriptions/${res.params.subscriptionId}/resourceGroups/rg2`,
              name: 'rg2',
              location: 'southcentralus',
              properties: { provisioningState: 'Succeeded' },
            },
          ],
        })
      )
  ),
];
