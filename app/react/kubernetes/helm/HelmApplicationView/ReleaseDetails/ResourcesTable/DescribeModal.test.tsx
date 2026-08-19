import { render, screen } from '@testing-library/react';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { DescribeModal } from './DescribeModal';

const mockUseDescribeResource = vi.fn();

// Mock the CodeEditor component instead of yaml-schema
vi.mock('@@/CodeEditor', () => ({
  CodeEditor: ({
    value,
    'data-cy': dataCy,
  }: {
    value: string;
    'data-cy'?: string;
  }) => <div data-cy={dataCy}>{value}</div>,
}));

vi.mock('./queries/useDescribeResource', () => ({
  useDescribeResource: (...args: unknown[]) => mockUseDescribeResource(...args),
}));

function renderComponent({
  name = 'test-resource',
  resourceType = 'Deployment',
  namespace = 'default',
  onDismiss = vi.fn(),
} = {}) {
  const Wrapped = withTestQueryProvider(DescribeModal);
  return render(
    <Wrapped
      name={name}
      resourceType={resourceType}
      namespace={namespace}
      onDismiss={onDismiss}
    />
  );
}

describe('DescribeModal', () => {
  beforeEach(() => {
    mockUseDescribeResource.mockReset();
  });

  it('should display loading state initially', () => {
    mockUseDescribeResource.mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
    });

    renderComponent();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display resource details when data is loaded successfully', () => {
    const mockDescribeData = {
      describe: 'Name: test-resource\nNamespace: default\nStatus: Running',
    };

    mockUseDescribeResource.mockReturnValue({
      isLoading: false,
      data: mockDescribeData,
      isError: false,
    });

    renderComponent();

    // Check for modal title
    expect(screen.getByText('Describe Deployment')).toBeInTheDocument();

    // Check for content
    const editor = screen.getByTestId('describe-resource');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveTextContent('Name: test-resource');
    expect(editor).toHaveTextContent('Namespace: default');
    expect(editor).toHaveTextContent('Status: Running');
  });

  it('should display error message when query fails', () => {
    mockUseDescribeResource.mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: true,
    });

    renderComponent();

    expect(
      screen.getByText('Error loading resource details')
    ).toBeInTheDocument();
  });

  it('should call onDismiss when modal is closed', () => {
    mockUseDescribeResource.mockReturnValue({
      isLoading: false,
      data: { describe: '' },
      isError: false,
    });

    const onDismiss = vi.fn();
    renderComponent({ onDismiss });

    // Find and click the close button
    const closeButton = screen.getByText('×');
    closeButton.click();

    expect(onDismiss).toHaveBeenCalled();
  });

  it('should pass correct parameters to useDescribeResource', () => {
    mockUseDescribeResource.mockReturnValue({
      isLoading: true,
      data: undefined,
      isError: false,
    });

    const props = {
      name: 'my-resource',
      resourceType: 'Pod',
      namespace: 'kube-system',
    };

    renderComponent(props);

    expect(mockUseDescribeResource).toHaveBeenCalledWith(
      props.name,
      props.resourceType,
      props.namespace
    );
  });
});
