import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';

import { TagsDatatable } from './TagsDatatable';
import { Tag } from './types';
import { RepositoryTagViewModel } from './view-model';

// Mock the necessary hooks
const mockUseCurrentStateAndParams = vi.fn();

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: () => mockUseCurrentStateAndParams(),
}));

// Mock the Link component to capture route parameters and generate proper hrefs
vi.mock('@@/Link', () => ({
  Link: ({
    children,
    params,
    'data-cy': dataCy,
    title,
  }: {
    children: React.ReactNode;
    params?: Record<string, string>;
    'data-cy'?: string;
    title?: string;
  }) => {
    // Simulate href generation based on route and params
    // For 'portainer.registries.registry.repository.tag' route
    const baseParams = {
      endpointId: '1',
      id: '1',
      repository: 'test-repo',
      ...params,
    };

    const tag = (baseParams as Record<string, string>).tag || '';
    const href = `/endpoints/${baseParams.endpointId}/registries/${baseParams.id}/repositories/${baseParams.repository}/tags/${tag}`;

    return (
      <a href={href} data-cy={dataCy} title={title}>
        {children}
      </a>
    );
  },
}));

vi.mock('../../queries/useTagDetails', () => ({
  useTagDetails: vi.fn(
    (
      params,
      { select }: { select?: (data: RepositoryTagViewModel) => string } = {}
    ) => {
      const data: RepositoryTagViewModel = {
        Name: params.tag,
        Os: 'linux',
        Architecture: 'amd64',
        ImageId: `sha256:${params.tag}123`,
        Size: 1024,
        ImageDigest: '',
        ManifestV2: {
          digest: `sha256:${params.tag}123`,
          schemaVersion: 2,
          mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
          config: {
            digest: `sha256:${params.tag}123`,
            mediaType: 'application/vnd.docker.container.image.v1+json',
            size: 1024,
          },
          layers: [],
        },
        History: [],
      };

      return {
        data: select?.(data) || data,
        isLoading: false,
        error: null,
      };
    }
  ),
}));

// Create mock data
const mockTags: Tag[] = [
  { Name: 'latest' },
  { Name: 'v1.0.0' },
  { Name: 'dev-branch' },
  { Name: 'feature/new-ui' },
];

const defaultProps = {
  dataset: mockTags,
  advancedFeaturesAvailable: true,
  onRemove: vi.fn(),
  onRetag: vi.fn().mockResolvedValue(undefined),
};

function renderComponent() {
  const Wrapped = withTestQueryProvider(
    withTestRouter(() => <TagsDatatable {...defaultProps} />)
  );
  return render(<Wrapped />);
}

describe('TagsDatatable', () => {
  beforeEach(() => {
    // Set up default mock values
    mockUseCurrentStateAndParams.mockReturnValue({
      params: {
        endpointId: '1',
        id: '1',
        repository: 'test-repo',
      },
    });
  });

  it('renders basic table structure', () => {
    renderComponent();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('renders tag data in table', () => {
    renderComponent();

    // Check that our mock tags are rendered somewhere in the table
    expect(screen.getByText('latest')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('dev-branch')).toBeInTheDocument();
    expect(screen.getByText('feature/new-ui')).toBeInTheDocument();
  });

  it('creates correct hrefs for tag name links', () => {
    renderComponent();

    // Get the links by their data-cy attributes
    const latestLink = screen.getByTestId(
      'registry-tag-name_latest'
    ) as HTMLAnchorElement;
    const v100Link = screen.getByTestId(
      'registry-tag-name_v1.0.0'
    ) as HTMLAnchorElement;
    const devBranchLink = screen.getByTestId(
      'registry-tag-name_dev-branch'
    ) as HTMLAnchorElement;
    const featureLink = screen.getByTestId(
      'registry-tag-name_feature/new-ui'
    ) as HTMLAnchorElement;

    // Verify the exact path portion of the href
    expect(new URL(latestLink.href).pathname).toBe(
      '/endpoints/1/registries/1/repositories/test-repo/tags/latest'
    );
    expect(new URL(v100Link.href).pathname).toBe(
      '/endpoints/1/registries/1/repositories/test-repo/tags/v1.0.0'
    );
    expect(new URL(devBranchLink.href).pathname).toBe(
      '/endpoints/1/registries/1/repositories/test-repo/tags/dev-branch'
    );
    expect(new URL(featureLink.href).pathname).toBe(
      '/endpoints/1/registries/1/repositories/test-repo/tags/feature/new-ui'
    );
  });
});
