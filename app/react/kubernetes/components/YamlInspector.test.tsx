import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';

import { AutomationTestingProps } from '@/types';

import { YAMLInspector } from './YAMLInspector';

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: vi.fn(() => 1),
}));

vi.mock('@/react/portainer/environments/queries/useEnvironment', () => ({
  useEnvironmentDeploymentOptions: vi.fn(() => ({
    data: { hideWebEditor: false },
  })),
}));

vi.mock('@/react/hooks/useUser', () => ({
  useAuthorizations: vi.fn(() => ({ authorized: true })),
}));

vi.mock('@@/modals/confirm', () => ({
  confirm: vi.fn(() => Promise.resolve(true)),
  buildConfirmButton: vi.fn((label) => ({ label })),
}));

vi.mock('./YAMLReplace/proxy/applyPatch', () => ({
  applyPatch: vi.fn(() => Promise.resolve()),
}));

vi.mock('@@/Widget', () => ({
  Loading: () => <div data-cy="loading-widget">Loading</div>,
}));

vi.mock('@@/Alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@@/WebEditorForm', () => ({
  WebEditorForm: ({
    value,
    onChange,
    id,
    readonly,
  }: {
    value: string;
    onChange?: (value: string) => void;
    id: string;
    readonly?: boolean;
  }) => (
    <textarea
      data-cy={id}
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      aria-readonly={readonly || false}
    />
  ),
}));

// mock the YAMLReplace component to avoid YAML parsing issues
vi.mock('./YAMLReplace', () => ({
  YAMLReplace: ({
    yml,
    originalYml,
    disabled,
  }: {
    yml: string;
    originalYml: string;
    disabled: boolean;
  }) => (
    <button
      data-cy="apply-changes-button"
      disabled={disabled || yml === originalYml}
      type="button"
    >
      Apply changes
    </button>
  ),
}));

vi.mock('@uirouter/react', () => ({
  useCurrentStateAndParams: vi.fn(() => ({ params: {} })),
  useRouter: vi.fn(() => ({
    stateService: { reload: vi.fn() },
  })),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

const sampleYaml = `apiVersion: v1
kind: ConfigMap
metadata:
  name: test-configmap
  namespace: default
  managedFields:
    - manager: kubectl
      operation: Update
      apiVersion: v1
  resourceVersion: "12345"
data:
  key1: value1
  key2: value2`;

interface RenderProps extends Partial<AutomationTestingProps> {
  identifier?: string;
  data?: string;
  hideMessage?: boolean;
  isLoading?: boolean;
  isError?: boolean;
}

function renderComponent({
  identifier = 'test-yaml',
  data = sampleYaml,
  hideMessage = false,
  isLoading = false,
  isError = false,
  'data-cy': dataCy = 'test-yaml-inspector',
}: RenderProps = {}) {
  return render(
    <YAMLInspector
      identifier={identifier}
      data={data}
      hideMessage={hideMessage}
      isLoading={isLoading}
      isError={isError}
      data-cy={dataCy}
    />
  );
}

test('renders WebEditorForm with cleaned YAML', () => {
  renderComponent();

  const renderedContent = screen.getByText(/ConfigMap/);
  expect(renderedContent).toBeInTheDocument();
});

test('toggles expand/collapse when button is clicked', async () => {
  const user = userEvent.setup();
  renderComponent();

  const expandButton = screen.getByText('Expand');
  expect(expandButton).toBeInTheDocument();

  await user.click(expandButton);
  expect(screen.getByText('Collapse')).toBeInTheDocument();

  await user.click(screen.getByText('Collapse'));
  expect(screen.getByText('Expand')).toBeInTheDocument();
});
