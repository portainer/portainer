import type { CellContext } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import {
  createMockStack,
  createMockWorkflowManagedStack,
} from '@/react-tools/test-mocks';
import { StackViewModel } from '@/react/docker/stacks/view-models/stack';

import { DecoratedStack } from '../types';

import { name } from './name';

describe('Docker Stacks name column', () => {
  it('shows a Workflow badge for workflow-managed stacks', () => {
    renderCell(new StackViewModel(createMockWorkflowManagedStack()));

    expect(screen.getByText('Workflow')).toBeInTheDocument();
  });

  it('does not show a Workflow badge for regular stacks', () => {
    renderCell(new StackViewModel(createMockStack()));

    expect(screen.queryByText('Workflow')).not.toBeInTheDocument();
  });

  it('does not show a Workflow badge for stacks deployed from an app template, even with a WorkflowID', () => {
    renderCell(
      new StackViewModel(
        createMockWorkflowManagedStack({ FromAppTemplate: true })
      )
    );

    expect(screen.queryByText('Workflow')).not.toBeInTheDocument();
  });
});

type CellFn = (ctx: CellContext<DecoratedStack, string>) => React.ReactNode;

function renderCell(item: DecoratedStack) {
  const ctx = {
    row: { original: item },
  } as unknown as CellContext<DecoratedStack, string>;

  const cellFn = name.cell as unknown as CellFn;
  function CellWrapper() {
    return <>{cellFn(ctx)}</>;
  }

  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(CellWrapper))
  );
  return render(<Wrapped />);
}
