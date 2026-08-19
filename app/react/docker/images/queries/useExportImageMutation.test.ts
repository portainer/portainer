import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { http, HttpResponse } from 'msw';
import { saveAs } from 'file-saver';
import { createElement, Fragment } from 'react';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { server } from '@/setup-tests/server';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';

import {
  useExportMutation,
  exportImage,
  getImagesNamesForDownload,
} from './useExportImageMutation';

function renderMutationHook() {
  const Wrapper = withTestQueryProvider(({ children }) =>
    createElement(Fragment, null, children)
  );

  return renderHook(() => useExportMutation(), {
    wrapper: Wrapper,
  });
}

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: '1' },
  })),
}));

describe('getImagesNamesForDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return tag names when images have tags', () => {
    const images = [
      { id: 'sha256:abc123', tags: ['nginx:latest', 'nginx:1.21'] },
      { id: 'sha256:def456', tags: ['redis:alpine'] },
    ];

    const result = getImagesNamesForDownload(images);

    expect(result.names).toEqual(['nginx:latest', 'redis:alpine']);
  });

  it('should return image id when tags are undefined', () => {
    const images = [
      { id: 'sha256:abc123', tags: undefined },
      { id: 'sha256:def456', tags: ['redis:alpine'] },
    ];

    const result = getImagesNamesForDownload(images);

    expect(result.names).toEqual(['sha256:abc123', 'redis:alpine']);
  });

  it('should return image id when tag is <none>:<none>', () => {
    const images = [
      { id: 'sha256:abc123', tags: ['<none>:<none>'] },
      { id: 'sha256:def456', tags: ['redis:alpine'] },
    ];

    const result = getImagesNamesForDownload(images);

    expect(result.names).toEqual(['sha256:abc123', 'redis:alpine']);
  });

  it('should return image id when tags array is empty', () => {
    const images = [
      { id: 'sha256:abc123', tags: [] },
      { id: 'sha256:def456', tags: ['redis:alpine'] },
    ];

    const result = getImagesNamesForDownload(images);

    expect(result.names).toEqual(['sha256:abc123', 'redis:alpine']);
  });
});

describe('exportImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export image and save file with correct filename', async () => {
    const mockBlob = new Blob(['image data'], { type: 'application/x-tar' });

    server.use(
      http.get(
        '/api/endpoints/:envId/docker/images/get',
        () =>
          new Response(mockBlob, {
            headers: {
              'content-disposition': 'attachment; filename=nginx-latest.tar',
            },
          })
      )
    );

    await exportImage({
      environmentId: 1,
      nodeName: undefined,
      images: [{ id: 'sha256:abc123', tags: ['nginx:latest'] }],
    });

    expect(saveAs).toHaveBeenCalledWith(mockBlob, 'nginx-latest.tar');
  });

  it('should include X-PortainerAgent-Target header when nodeName is provided', async () => {
    let requestHeaders: Record<string, string | undefined> = {};

    server.use(
      http.get('/api/endpoints/:envId/docker/images/get', ({ request }) => {
        requestHeaders = Object.fromEntries(request.headers.entries());
        return new Response(new Blob(['image data']), {
          headers: {
            'content-disposition': 'attachment; filename=test.tar',
          },
        });
      })
    );

    await exportImage({
      environmentId: 1,
      nodeName: 'worker-node-1',
      images: [{ id: 'sha256:abc123', tags: ['nginx:latest'] }],
    });

    expect(requestHeaders['x-portaineragent-target']).toBe('worker-node-1');
  });

  it('should not include X-PortainerAgent-Target header when nodeName is undefined', async () => {
    let requestHeaders: Record<string, string | undefined> = {};

    server.use(
      http.get('/api/endpoints/:envId/docker/images/get', ({ request }) => {
        requestHeaders = Object.fromEntries(request.headers.entries());
        return new Response(new Blob(['image data']), {
          headers: {
            'content-disposition': 'attachment; filename=test.tar',
          },
        });
      })
    );

    await exportImage({
      environmentId: 1,
      nodeName: undefined,
      images: [{ id: 'sha256:abc123', tags: ['nginx:latest'] }],
    });

    expect(requestHeaders['x-portaineragent-target']).toBeUndefined();
  });

  it('should send correct image names as query params', async () => {
    let requestUrl = '';

    server.use(
      http.get('/api/endpoints/:envId/docker/images/get', ({ request }) => {
        requestUrl = request.url;

        return new Response(new Blob(['image data']), {
          headers: {
            'content-disposition': 'attachment; filename=test.tar',
          },
        });
      })
    );

    await exportImage({
      environmentId: 1,
      nodeName: undefined,
      images: [
        { id: 'sha256:abc123', tags: ['nginx:latest'] },
        { id: 'sha256:def456', tags: ['redis:alpine'] },
      ],
    });

    const url = new URL(requestUrl);
    // Axios serializes array params with brackets: names[]=value1&names[]=value2
    const names = url.searchParams.getAll('names[]');
    expect(names).toEqual(['nginx:latest', 'redis:alpine']);
    expect(saveAs).toHaveBeenCalled();
  });

  it('should send mix of tags and IDs in query params for images without tags', async () => {
    let requestUrl = '';

    server.use(
      http.get('/api/endpoints/:envId/docker/images/get', ({ request }) => {
        requestUrl = request.url;
        return new Response(new Blob(['image data']), {
          headers: {
            'content-disposition': 'attachment; filename=test.tar',
          },
        });
      })
    );

    await exportImage({
      environmentId: 1,
      nodeName: undefined,
      images: [
        { id: 'sha256:abc123', tags: ['nginx:latest'] },
        { id: 'sha256:def456', tags: undefined },
        { id: 'sha256:ghi789', tags: ['<none>:<none>'] },
        { id: 'sha256:jkl012', tags: [] },
      ],
    });

    const url = new URL(requestUrl);
    const names = url.searchParams.getAll('names[]');
    expect(names).toEqual([
      'nginx:latest',
      'sha256:def456',
      'sha256:ghi789',
      'sha256:jkl012',
    ]);
    expect(saveAs).toHaveBeenCalled();
  });

  it('should throw error when export fails', async () => {
    const restoreConsole = suppressConsoleLogs();

    server.use(
      http.get('/api/endpoints/:envId/docker/images/get', () =>
        HttpResponse.json({ message: 'Image not found' }, { status: 404 })
      )
    );

    await expect(
      exportImage({
        environmentId: 1,
        nodeName: undefined,
        images: [{ id: 'sha256:abc123', tags: ['nginx:latest'] }],
      })
    ).rejects.toThrow('Unable to export image');

    restoreConsole();
  });

  it('should handle filename without content-disposition header', async () => {
    const mockBlob = new Blob(['image data'], { type: 'application/x-tar' });

    server.use(
      http.get(
        '/api/endpoints/:envId/docker/images/get',
        () => new Response(mockBlob)
      )
    );

    await exportImage({
      environmentId: 1,
      nodeName: undefined,
      images: [{ id: 'sha256:abc123', tags: ['nginx:latest'] }],
    });

    expect(saveAs).toHaveBeenCalledWith(mockBlob, '');
  });
});

describe('useExportMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully export images', async () => {
    const mockBlob = new Blob(['image data'], { type: 'application/x-tar' });

    server.use(
      http.get(
        '/api/endpoints/:envId/docker/images/get',
        () =>
          new Response(mockBlob, {
            headers: {
              'content-disposition': 'attachment; filename=nginx-latest.tar',
            },
          })
      )
    );

    const { result } = renderMutationHook();

    result.current.mutate({
      images: [{ id: 'sha256:abc123', tags: ['nginx:latest'] }],
      nodeName: undefined,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(saveAs).toHaveBeenCalledWith(mockBlob, 'nginx-latest.tar');
  });

  it('should handle export error', async () => {
    const restoreConsole = suppressConsoleLogs();

    server.use(
      http.get('/api/endpoints/:envId/docker/images/get', () =>
        HttpResponse.json({ message: 'Internal server error' }, { status: 500 })
      )
    );

    const { result } = renderMutationHook();

    result.current.mutate({
      images: [{ id: 'sha256:abc123', tags: ['nginx:latest'] }],
      nodeName: undefined,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
    restoreConsole();
  });

  it('should export multiple images with node name', async () => {
    const mockBlob = new Blob(['image data'], { type: 'application/x-tar' });
    let requestHeaders: Record<string, string | undefined> = {};

    server.use(
      http.get('/api/endpoints/:envId/docker/images/get', ({ request }) => {
        requestHeaders = Object.fromEntries(request.headers.entries());
        return new Response(mockBlob, {
          headers: {
            'content-disposition': 'attachment; filename=images.tar',
          },
        });
      })
    );

    const { result } = renderMutationHook();

    result.current.mutate({
      images: [
        { id: 'sha256:abc123', tags: ['nginx:latest'] },
        { id: 'sha256:def456', tags: ['redis:alpine'] },
        { id: 'sha256:ghi789', tags: undefined },
      ],
      nodeName: 'worker-node-1',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(saveAs).toHaveBeenCalledWith(mockBlob, 'images.tar');
    expect(requestHeaders['x-portaineragent-target']).toBe('worker-node-1');
  });
});
