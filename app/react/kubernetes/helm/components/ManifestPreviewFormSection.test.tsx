import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { UserViewModel } from '@/portainer/models/user';

import { ManifestPreviewFormSection } from './ManifestPreviewFormSection';

// Mock the necessary hooks
const mockUseHelmDryRun = vi.fn();
const mockUseDebouncedValue = vi.fn();

vi.mock('../helmReleaseQueries/useHelmDryRun', () => ({
  useHelmDryRun: (...args: unknown[]) => mockUseHelmDryRun(...args),
}));

vi.mock('@/react/hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: unknown, delay: number) =>
    mockUseDebouncedValue(value, delay),
}));

// Mock the CodeEditor and DiffViewer components
vi.mock('@@/CodeEditor', () => ({
  CodeEditor: ({
    'data-cy': dataCy,
    value,
  }: {
    'data-cy'?: string;
    value: string;
  }) => (
    <div data-cy={dataCy} data-testid="code-editor">
      {value}
    </div>
  ),
}));

vi.mock('@@/CodeEditor/DiffViewer', () => ({
  DiffViewer: ({
    'data-cy': dataCy,
    originalCode,
    newCode,
  }: {
    'data-cy'?: string;
    originalCode: string;
    newCode: string;
  }) => (
    <div data-cy={dataCy} data-testid="diff-viewer">
      <div data-testid="original-code">{originalCode}</div>
      <div data-testid="new-code">{newCode}</div>
    </div>
  ),
}));

const mockOnChangePreviewValidation = vi.fn();

const defaultProps = {
  payload: {
    name: 'test-release',
    namespace: 'test-namespace',
    chart: 'test-chart',
    version: '1.0.0',
    repo: 'test-repo',
  },
  onChangePreviewValidation: mockOnChangePreviewValidation,
  title: 'Manifest Preview',
  environmentId: 1,
};

function renderComponent(props = {}) {
  const user = new UserViewModel({ Username: 'user', Role: 1 });

  const Component = withTestQueryProvider(
    withUserProvider(
      withTestRouter(() => (
        <ManifestPreviewFormSection {...defaultProps} {...props} />
      )),
      user
    )
  );

  return render(<Component />);
}

describe('ManifestPreviewFormSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for useDebouncedValue - returns the value as-is
    mockUseDebouncedValue.mockImplementation((value) => value);
  });

  it('should show loading and no form section when loading', () => {
    mockUseHelmDryRun.mockReturnValue({
      isInitialLoading: true,
      isError: false,
      data: undefined,
    });

    renderComponent();

    expect(
      screen.getByText('Generating manifest preview...')
    ).toBeInTheDocument();
    expect(screen.queryByText('Manifest Preview')).not.toBeInTheDocument();
  });

  it("should show error when there's an error", async () => {
    mockUseHelmDryRun.mockReturnValue({
      isInitialLoading: false,
      isError: true,
      error: { message: 'Invalid chart configuration' },
      data: undefined,
    });

    renderComponent();

    expect(screen.queryByText('Manifest Preview')).toBeInTheDocument();
    // there should be an error badge
    expect(
      screen.queryByTestId('helm-manifest-preview-error-badge')
    ).toBeInTheDocument();
    const expandButton = screen.getByLabelText('Expand');
    await userEvent.click(expandButton);

    expect(
      screen.getByText('Error with Helm chart configuration')
    ).toBeInTheDocument();
    expect(screen.getByText('Invalid chart configuration')).toBeInTheDocument();
  });

  it('should show single code editor when only the generated manifest is available', async () => {
    const mockManifest = 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: test';

    mockUseHelmDryRun.mockReturnValue({
      isInitialLoading: false,
      isError: false,
      data: { manifest: mockManifest },
    });

    renderComponent();

    expect(screen.getByText('Manifest Preview')).toBeInTheDocument();

    // Expand the FormSection to see the content
    const expandButton = screen.getByLabelText('Expand');
    await userEvent.click(expandButton);

    // Check that the manifest content is rendered (from the HTML, we can see it's there)
    expect(
      screen.getByText(/apiVersion/, { exact: false })
    ).toBeInTheDocument();
    expect(screen.getByText(/test/, { exact: false })).toBeInTheDocument();
  });

  it('should show the diff when the current and generated manifest are available', async () => {
    const currentManifest = 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: old';
    const newManifest = 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: new';

    mockUseHelmDryRun.mockReturnValue({
      isInitialLoading: false,
      isError: false,
      data: { manifest: newManifest },
    });

    renderComponent({ currentManifest });

    expect(screen.getByText('Manifest Preview')).toBeInTheDocument();

    // Expand the FormSection to see the content
    const expandButton = screen.getByLabelText('Expand');
    await userEvent.click(expandButton);

    // Check that both old and new manifest content is rendered
    expect(screen.getByText(/old/, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/new/, { exact: false })).toBeInTheDocument();
  });

  it('should call onChangePreviewValidation with correct validation state', () => {
    mockUseHelmDryRun.mockReturnValue({
      isInitialLoading: false,
      isError: false,
      data: { manifest: 'test' },
    });

    renderComponent();

    expect(mockOnChangePreviewValidation).toHaveBeenCalledWith(true);
  });

  it('should call onChangePreviewValidation with false when error occurs', () => {
    mockUseHelmDryRun.mockReturnValue({
      isInitialLoading: false,
      isError: true,
      error: { message: 'Error' },
      data: undefined,
    });

    renderComponent();

    expect(mockOnChangePreviewValidation).toHaveBeenCalledWith(false);
  });
});
