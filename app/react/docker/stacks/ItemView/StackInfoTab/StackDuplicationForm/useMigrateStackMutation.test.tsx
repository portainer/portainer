import { http, HttpResponse } from 'msw';

import { server } from '@/setup-tests/server';

import { StackType } from '../../../../../common/stacks/types';

import { routeMigrationRequest } from './useMigrateStackMutation';

type MigrateRequestBody = {
  EndpointID: number;
  Name?: string;
  SwarmID?: string;
};

describe('Swarm stack migration', () => {
  server.use(
    http.get('/api/endpoints/:id/docker/swarm', () =>
      HttpResponse.json({ ID: 'target-swarm-456' })
    ),
    http.post('/api/stacks/:id/migrate', () => HttpResponse.json({}))
  );

  it('should throw error if fromSwarmId is missing', async () => {
    await expect(
      routeMigrationRequest({
        stackType: StackType.DockerSwarm,
        id: 1,
        fromEnvId: 1,
        targetEnvId: 2,
        name: 'test-stack',
        fromSwarmId: undefined,
      })
    ).rejects.toThrow('Original Swarm ID is required');
  });

  it('should call getSwarm with targetEnvId', async () => {
    let swarmRequestCalled = false;
    let capturedTargetEnvId: string | undefined;

    server.use(
      http.get('/api/endpoints/:id/docker/swarm', ({ params }) => {
        swarmRequestCalled = true;
        capturedTargetEnvId = params.id as string;
        return HttpResponse.json({ ID: 'target-swarm-456' });
      }),
      http.post('/api/stacks/:id/migrate', () => HttpResponse.json({}))
    );

    await routeMigrationRequest({
      stackType: StackType.DockerSwarm,
      id: 1,
      fromEnvId: 1,
      targetEnvId: 3,
      name: 'test-stack',
      fromSwarmId: 'source-swarm-123',
    });

    expect(swarmRequestCalled).toBe(true);
    expect(capturedTargetEnvId).toBe('3');
  });

  it('should throw error if target Swarm ID matches source Swarm ID', async () => {
    const sameSwarmId = 'swarm123';

    server.use(
      http.get('/api/endpoints/:id/docker/swarm', () =>
        HttpResponse.json({ ID: sameSwarmId })
      )
    );

    await expect(
      routeMigrationRequest({
        stackType: StackType.DockerSwarm,
        id: 1,
        fromEnvId: 1,
        targetEnvId: 2,
        name: 'test-stack',
        fromSwarmId: sameSwarmId,
      })
    ).rejects.toThrow('same Swarm cluster');
  });

  it('should call migrateStack with targetSwarmId', async () => {
    const targetSwarmId = 'target-swarm-456';
    let migrateRequestBody: MigrateRequestBody | undefined;

    server.use(
      http.get('/api/endpoints/:id/docker/swarm', () =>
        HttpResponse.json({ ID: targetSwarmId })
      ),
      http.post('/api/stacks/:id/migrate', async ({ request }) => {
        migrateRequestBody = (await request.json()) as MigrateRequestBody;
        return HttpResponse.json({});
      })
    );

    await routeMigrationRequest({
      stackType: StackType.DockerSwarm,
      id: 5,
      fromEnvId: 1,
      targetEnvId: 2,
      name: 'swarm-stack',
      fromSwarmId: 'source-swarm-123',
    });

    expect(migrateRequestBody).toBeDefined();
    expect(migrateRequestBody?.SwarmID).toBe(targetSwarmId);
  });

  it('should include name parameter if provided', async () => {
    let migrateRequestBody: MigrateRequestBody | undefined;

    server.use(
      http.get('/api/endpoints/:id/docker/swarm', () =>
        HttpResponse.json({ ID: 'target-swarm-456' })
      ),
      http.post('/api/stacks/:id/migrate', async ({ request }) => {
        migrateRequestBody = (await request.json()) as MigrateRequestBody;
        return HttpResponse.json({});
      })
    );

    await routeMigrationRequest({
      stackType: StackType.DockerSwarm,
      id: 5,
      fromEnvId: 1,
      targetEnvId: 2,
      name: 'new-stack-name',
      fromSwarmId: 'source-swarm-123',
    });

    expect(migrateRequestBody?.Name).toBe('new-stack-name');
  });
});

describe('Standalone stack migration', () => {
  it('should call migrateStack without targetSwarmId for standalone stacks', async () => {
    let migrateRequestBody: MigrateRequestBody | undefined;

    server.use(
      http.post('/api/stacks/:id/migrate', async ({ request }) => {
        migrateRequestBody = (await request.json()) as MigrateRequestBody;
        return HttpResponse.json({});
      })
    );

    await routeMigrationRequest({
      stackType: StackType.DockerCompose,
      id: 3,
      fromEnvId: 1,
      targetEnvId: 2,
      name: 'compose-stack',
    });

    expect(migrateRequestBody).toBeDefined();
    expect(migrateRequestBody?.SwarmID).toBeUndefined();
  });

  it('should pass id, fromEnvId, targetEnvId, name', async () => {
    let migrateRequestBody: MigrateRequestBody | undefined;
    let migrateRequestParams: { endpointId: string | null } | undefined;
    let stackId: string | undefined;

    server.use(
      http.post('/api/stacks/:id/migrate', async ({ request, params }) => {
        migrateRequestBody = (await request.json()) as MigrateRequestBody;
        stackId = params.id as string;
        const url = new URL(request.url);
        migrateRequestParams = {
          endpointId: url.searchParams.get('endpointId'),
        };
        return HttpResponse.json({});
      })
    );

    await routeMigrationRequest({
      stackType: StackType.DockerCompose,
      id: 7,
      fromEnvId: 4,
      targetEnvId: 5,
      name: 'my-stack',
    });

    expect(stackId).toBe('7');
    expect(migrateRequestBody?.EndpointID).toBe(5);
    expect(migrateRequestBody?.Name).toBe('my-stack');
    expect(migrateRequestParams?.endpointId).toBe('4');
  });

  it('should not call getSwarm for standalone stacks', async () => {
    let swarmRequestCalled = false;

    server.use(
      http.get('/api/endpoints/:id/docker/swarm', () => {
        swarmRequestCalled = true;
        return HttpResponse.json({ ID: 'swarm123' });
      }),
      http.post('/api/stacks/:id/migrate', () => HttpResponse.json({}))
    );

    await routeMigrationRequest({
      stackType: StackType.DockerCompose,
      id: 3,
      fromEnvId: 1,
      targetEnvId: 2,
      name: 'compose-stack',
    });

    expect(swarmRequestCalled).toBe(false);
  });
});

describe('API request structure', () => {
  it('should POST to correct URL (buildStackUrl(id, "migrate"))', async () => {
    let requestPath: string | undefined;

    server.use(
      http.post('/api/stacks/:id/migrate', ({ request }) => {
        requestPath = new URL(request.url).pathname;
        return HttpResponse.json({});
      })
    );

    await routeMigrationRequest({
      stackType: StackType.DockerCompose,
      id: 123,
      fromEnvId: 1,
      targetEnvId: 2,
    });

    expect(requestPath).toBe('/api/stacks/123/migrate');
  });

  it('should include EndpointID, Name, SwarmID in request body', async () => {
    let requestBody: MigrateRequestBody | undefined;

    server.use(
      http.post('/api/stacks/:id/migrate', async ({ request }) => {
        requestBody = (await request.json()) as MigrateRequestBody;
        return HttpResponse.json({});
      })
    );

    await routeMigrationRequest({
      stackType: StackType.DockerCompose,
      id: 10,
      fromEnvId: 1,
      targetEnvId: 3,
      name: 'test-stack',
    });

    expect(requestBody).toBeDefined();
    expect(requestBody).toHaveProperty('EndpointID');
    expect(requestBody).toHaveProperty('Name');
    expect(requestBody?.EndpointID).toBe(3);
    expect(requestBody?.Name).toBe('test-stack');
  });

  it('should include endpointId in query params (fromEnvId)', async () => {
    let queryParams: URLSearchParams | undefined;

    server.use(
      http.post('/api/stacks/:id/migrate', ({ request }) => {
        queryParams = new URL(request.url).searchParams;
        return HttpResponse.json({});
      })
    );

    await routeMigrationRequest({
      stackType: StackType.DockerCompose,
      id: 10,
      fromEnvId: 7,
      targetEnvId: 3,
    });

    expect(queryParams?.get('endpointId')).toBe('7');
  });
});

describe('error handling', () => {
  it('should parse axios errors correctly', async () => {
    server.use(
      http.post('/api/stacks/:id/migrate', () =>
        HttpResponse.json(
          { message: 'Migration failed', details: 'Stack not found' },
          { status: 404 }
        )
      )
    );

    await expect(
      routeMigrationRequest({
        stackType: StackType.DockerCompose,
        id: 999,
        fromEnvId: 1,
        targetEnvId: 2,
      })
    ).rejects.toThrow();
  });

  it('should propagate errors from getSwarm', async () => {
    server.use(
      http.get('/api/endpoints/:id/docker/swarm', () =>
        HttpResponse.json({ message: 'Swarm not available' }, { status: 503 })
      )
    );

    await expect(
      routeMigrationRequest({
        stackType: StackType.DockerSwarm,
        id: 1,
        fromEnvId: 1,
        targetEnvId: 2,
        fromSwarmId: 'swarm123',
      })
    ).rejects.toThrow();
  });

  it('should propagate errors from API call', async () => {
    server.use(
      http.post('/api/stacks/:id/migrate', () =>
        HttpResponse.json(
          { message: 'Insufficient permissions' },
          { status: 403 }
        )
      )
    );

    await expect(
      routeMigrationRequest({
        stackType: StackType.DockerCompose,
        id: 1,
        fromEnvId: 1,
        targetEnvId: 2,
      })
    ).rejects.toThrow();
  });

  it('should handle network errors', async () => {
    server.use(
      http.post('/api/stacks/:id/migrate', () => HttpResponse.error())
    );

    await expect(
      routeMigrationRequest({
        stackType: StackType.DockerCompose,
        id: 1,
        fromEnvId: 1,
        targetEnvId: 2,
      })
    ).rejects.toThrow();
  });
});
