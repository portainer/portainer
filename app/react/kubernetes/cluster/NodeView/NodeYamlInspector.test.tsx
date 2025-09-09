import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { confirm } from '@@/modals/confirm';

import { NodeYamlInspector } from './NodeYamlInspector';

const sampleNodeYaml: string = `apiVersion: v1
kind: Node
metadata:
  name: test-node
  labels:
    kubernetes.io/hostname: test-node
    node-role.kubernetes.io/worker: ""
spec:
  podCIDR: 10.244.1.0/24
  podCIDRs:
  - 10.244.1.0/24
status:
  addresses:
  - address: 192.168.1.100
    type: InternalIP
  - address: test-node
    type: Hostname
  capacity:
    cpu: "4"
    memory: 8Gi
    pods: "110"
  conditions:
  - type: Ready
    status: "True"`;

// Mock the useNodeQuery hook
vi.mock('../queries/useNodeQuery', () => ({
  useNodeQuery: vi.fn(() => ({
    data: sampleNodeYaml,
    isInitialLoading: false,
    isError: false,
  })),
}));

// Mock the useAuthorizations hook
vi.mock('@/react/hooks/useUser', () => ({
  useAuthorizations: vi.fn(() => ({
    authorized: true,
    isLoading: false,
  })),
}));

// Mock the confirm modal
vi.mock('@@/modals/confirm', () => ({
  confirm: vi.fn(() => Promise.resolve(true)),
  buildConfirmButton: vi.fn((label) => ({ label })),
}));

// Mock the Widget components
vi.mock('@@/Widget', () => ({
  Widget: ({ children }: { children: React.ReactNode }) => (
    <div data-cy="widget">{children}</div>
  ),
  WidgetBody: ({ children }: { children: React.ReactNode }) => (
    <div data-cy="widget-body">{children}</div>
  ),
}));

// Mock the YAMLInspector component to simulate its behavior
vi.mock('../../components/YAMLInspector', () => ({
  YAMLInspector: ({
    data,
    confirmMessage,
    'data-cy': dataCy,
  }: {
    data: string;
    confirmMessage?: string;
    'data-cy'?: string;
  }) => (
    <div data-cy={dataCy}>
      <textarea data-cy="yaml-editor" defaultValue={data} onChange={() => {}} />
      <button
        data-cy="apply-changes-button"
        type="button"
        onClick={() => {
          if (confirmMessage) {
            confirm({
              message: confirmMessage,
              title: 'Are you sure?',
            });
          }
        }}
      >
        Apply changes
      </button>
    </div>
  ),
}));

function renderComponent({
  environmentId = 1,
  nodeName = 'test-node',
}: {
  environmentId?: number;
  nodeName?: string;
} = {}) {
  return render(
    <NodeYamlInspector environmentId={environmentId} nodeName={nodeName} />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

test('renders NodeYamlInspector with node YAML data', () => {
  renderComponent();

  expect(screen.getByTestId('node-yaml')).toBeInTheDocument();
  expect(screen.getByTestId('yaml-editor')).toBeInTheDocument();
  expect(screen.getByText(/kind: Node/)).toBeInTheDocument();
});

test('passes correct props to YAMLInspector', () => {
  renderComponent({ environmentId: 2, nodeName: 'worker-node' });

  const yamlInspector = screen.getByTestId('node-yaml');
  expect(yamlInspector).toBeInTheDocument();

  // Verify the YAML editor contains the sample data
  const editor = screen.getByTestId('yaml-editor');
  expect(editor).toHaveValue(sampleNodeYaml);
});
