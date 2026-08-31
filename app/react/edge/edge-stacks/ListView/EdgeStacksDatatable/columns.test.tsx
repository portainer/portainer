import type { CellContext } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';

import { withTestRouter } from '@/react/test-utils/withRouter';
import { createMockEdgeStack } from '@/react-tools/test-mocks';

import { columns } from './columns';
import { DecoratedEdgeStack } from './types';

type CellFn = (
  ctx: CellContext<DecoratedEdgeStack, unknown>
) => React.ReactNode;

function renderNameCell(item: DecoratedEdgeStack) {
  const ctx = {
    renderValue: () => item.Name,
    row: { original: item },
  } as unknown as CellContext<DecoratedEdgeStack, unknown>;

  const cellFn = columns[0].cell as unknown as CellFn;
  function CellWrapper() {
    return <>{cellFn(ctx)}</>;
  }

  const Wrapped = withTestRouter(CellWrapper);
  return render(<Wrapped />);
}

function workflowManagedEdgeStack() {
  return createMockEdgeStack({
    Name: 'workflow-stack',
    WorkflowID: 1,
    GitSourceId: 1,
    GitConfig: {
      URL: 'https://github.com/test/repo',
      ReferenceName: 'main',
      ConfigFilePath: 'manifest.yml',
      ConfigHash: '',
      TLSSkipVerify: false,
    },
  });
}

describe('Edge Stacks name column', () => {
  it('shows a Workflow badge for workflow-managed edge stacks', () => {
    renderNameCell(workflowManagedEdgeStack());

    expect(screen.getByText('Workflow')).toBeInTheDocument();
  });

  it('does not show a Workflow badge for regular edge stacks', () => {
    renderNameCell(createMockEdgeStack({ Name: 'regular-stack' }));

    expect(screen.queryByText('Workflow')).not.toBeInTheDocument();
  });
});
