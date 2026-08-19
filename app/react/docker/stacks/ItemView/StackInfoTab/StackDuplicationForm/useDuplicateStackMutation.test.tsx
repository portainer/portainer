import { http, HttpResponse } from 'msw';

import { server } from '@/setup-tests/server';

import { StackType } from '../../../../../common/stacks/types';

import { duplicateStack } from './useDuplicateStackMutation';

type StackRequestBody = {
  name: string;
  swarmID: string;
  env?: Array<{ name: string; value: string }>;
};

describe('Swarm stack duplication', () => {
  it('should call getSwarm with targetEnvironmentId for Swarm stacks', async () => {
    const swarmId = 'swarm123';
    let swarmRequestCalled = false;

    server.use(
      http.get('/api/endpoints/:id/docker/swarm', ({ params }) => {
        swarmRequestCalled = true;
        expect(params.id).toBe('2');
        return HttpResponse.json({ ID: swarmId });
      }),
      http.post('/api/stacks/create/:type/:method', async () =>
        HttpResponse.json({ Id: 123 })
      )
    );

    await duplicateStack({
      name: 'test-stack',
      fileContent: 'version: "3"\nservices:\n  app:\n    image: nginx',
      targetEnvironmentId: 2,
      type: StackType.DockerSwarm,
      env: [{ name: 'VAR1', value: 'value1' }],
    });

    expect(swarmRequestCalled).toBe(true);
  });

  it('should call createSwarmStackFromFileContent with correct parameters', async () => {
    const swarmId = 'swarm123';
    let stackRequestBody: undefined | StackRequestBody;

    server.use(
      http.get('/api/endpoints/:id/docker/swarm', () =>
        HttpResponse.json({ ID: swarmId })
      ),
      http.post('/api/stacks/create/:type/:method', async ({ request }) => {
        stackRequestBody = (await request.json()) as StackRequestBody;

        return HttpResponse.json({ Id: 123 });
      })
    );

    const fileContent = 'version: "3"\nservices:\n  app:\n    image: nginx';
    const env = [{ name: 'VAR1', value: 'value1' }];

    await duplicateStack({
      name: 'test-stack',
      fileContent,
      targetEnvironmentId: 2,
      type: StackType.DockerSwarm,
      env,
    });

    expect(stackRequestBody).toBeDefined();
    expect(stackRequestBody?.name).toBe('test-stack');
    expect(stackRequestBody?.swarmID).toBe(swarmId);
  });

  it('should throw error if Swarm ID is missing', async () => {
    server.use(
      http.get('/api/endpoints/:id/docker/swarm', () =>
        HttpResponse.json({ ID: '' })
      )
    );

    await expect(
      duplicateStack({
        name: 'test-stack',
        fileContent: 'version: "3"\nservices:\n  app:\n    image: nginx',
        targetEnvironmentId: 2,
        type: StackType.DockerSwarm,
      })
    ).rejects.toThrow('Swarm ID is required');
  });

  it('should pass swarmID from getSwarm response', async () => {
    const swarmId = 'custom-swarm-id-456';
    let stackRequestBody: StackRequestBody | undefined;

    server.use(
      http.get('/api/endpoints/:id/docker/swarm', () =>
        HttpResponse.json({ ID: swarmId })
      ),
      http.post('/api/stacks/create/:type/:method', async ({ request }) => {
        stackRequestBody = (await request.json()) as StackRequestBody;
        return HttpResponse.json({ Id: 123 });
      })
    );

    await duplicateStack({
      name: 'test-stack',
      fileContent: 'version: "3"\nservices:\n  app:\n    image: nginx',
      targetEnvironmentId: 2,
      type: StackType.DockerSwarm,
    });

    expect(stackRequestBody?.swarmID).toBe(swarmId);
  });

  it('should pass environmentId, name, stackFileContent, env', async () => {
    const swarmId = 'swarm123';
    let stackRequestBody: StackRequestBody | undefined;

    server.use(
      http.get('/api/endpoints/:id/docker/swarm', () =>
        HttpResponse.json({ ID: swarmId })
      ),
      http.post('/api/stacks/create/:type/:method', async ({ request }) => {
        stackRequestBody = (await request.json()) as StackRequestBody;
        return HttpResponse.json({ Id: 123 });
      })
    );

    const fileContent = 'version: "3"\nservices:\n  app:\n    image: nginx';
    const env = [
      { name: 'VAR1', value: 'value1' },
      { name: 'VAR2', value: 'value2' },
    ];

    await duplicateStack({
      name: 'my-swarm-stack',
      fileContent,
      targetEnvironmentId: 3,
      type: StackType.DockerSwarm,
      env,
    });

    expect(stackRequestBody).toBeDefined();
    expect(stackRequestBody?.name).toBe('my-swarm-stack');
    expect(stackRequestBody?.env).toEqual(env);
  });
});

describe('Standalone stack duplication', () => {
  it('should call createStandaloneStackFromFileContent for non-Swarm stacks', async () => {
    let stackRequestBody: StackRequestBody | undefined;

    server.use(
      http.post('/api/stacks/create/:type/:method', async ({ request }) => {
        stackRequestBody = (await request.json()) as StackRequestBody;
        return HttpResponse.json({ Id: 123 });
      })
    );

    await duplicateStack({
      name: 'standalone-stack',
      fileContent: 'version: "3"\nservices:\n  app:\n    image: nginx',
      targetEnvironmentId: 2,
      type: StackType.DockerCompose,
    });

    expect(stackRequestBody).toBeDefined();
    expect(stackRequestBody?.name).toBe('standalone-stack');
  });

  it('should pass environmentId, name, stackFileContent, env', async () => {
    let stackRequestBody: StackRequestBody | undefined;

    server.use(
      http.post('/api/stacks/create/:type/:method', async ({ request }) => {
        stackRequestBody = (await request.json()) as StackRequestBody;
        return HttpResponse.json({ Id: 123 });
      })
    );

    const fileContent = 'version: "3"\nservices:\n  web:\n    image: nginx';
    const env = [{ name: 'PORT', value: '8080' }];

    await duplicateStack({
      name: 'compose-stack',
      fileContent,
      targetEnvironmentId: 5,
      type: StackType.DockerCompose,
      env,
    });

    expect(stackRequestBody).toBeDefined();
    expect(stackRequestBody?.name).toBe('compose-stack');
    expect(stackRequestBody?.env).toEqual(env);
  });

  it('should not call getSwarm for standalone stacks', async () => {
    let swarmRequestCalled = false;

    server.use(
      http.get('/api/endpoints/:id/docker/swarm', () => {
        swarmRequestCalled = true;
        return HttpResponse.json({ ID: 'swarm123' });
      }),
      http.post('/api/stacks/create/:type/:method', () =>
        HttpResponse.json({ Id: 123 })
      )
    );

    await duplicateStack({
      name: 'standalone-stack',
      fileContent: 'version: "3"\nservices:\n  app:\n    image: nginx',
      targetEnvironmentId: 2,
      type: StackType.DockerCompose,
    });

    expect(swarmRequestCalled).toBe(false);
  });
});

describe('error handling', () => {
  it('should propagate errors from getSwarm', async () => {
    server.use(
      http.get('/api/endpoints/:id/docker/swarm', () =>
        HttpResponse.json({ message: 'Swarm not found' }, { status: 404 })
      )
    );

    await expect(
      duplicateStack({
        name: 'test-stack',
        fileContent: 'version: "3"\nservices:\n  app:\n    image: nginx',
        targetEnvironmentId: 2,
        type: StackType.DockerSwarm,
      })
    ).rejects.toThrow();
  });

  it('should propagate errors from createSwarmStackFromFileContent', async () => {
    server.use(
      http.get('/api/endpoints/:id/docker/swarm', () =>
        HttpResponse.json({ ID: 'swarm123' })
      ),
      http.post('/api/stacks/create/:type/:method', () =>
        HttpResponse.json({ message: 'Stack creation failed' }, { status: 500 })
      )
    );

    await expect(
      duplicateStack({
        name: 'test-stack',
        fileContent: 'version: "3"\nservices:\n  app:\n    image: nginx',
        targetEnvironmentId: 2,
        type: StackType.DockerSwarm,
      })
    ).rejects.toThrow();
  });

  it('should propagate errors from createStandaloneStackFromFileContent', async () => {
    server.use(
      http.post('/api/stacks/create/:type/:method', () =>
        HttpResponse.json(
          { message: 'Stack name already exists' },
          { status: 409 }
        )
      )
    );

    await expect(
      duplicateStack({
        name: 'existing-stack',
        fileContent: 'version: "3"\nservices:\n  app:\n    image: nginx',
        targetEnvironmentId: 2,
        type: StackType.DockerCompose,
      })
    ).rejects.toThrow();
  });
});
