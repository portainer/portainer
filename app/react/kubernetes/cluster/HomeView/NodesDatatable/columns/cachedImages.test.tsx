import type { CellContext } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import type { NodeRowData } from '../types';

import { cachedImages } from './cachedImages';

type CellFn = (ctx: CellContext<NodeRowData, number>) => React.ReactNode;

function makeNode(
  images: Array<{ names?: string[]; sizeBytes?: number }> = [],
  name = 'test-node'
): NodeRowData {
  return {
    isApi: false,
    isPublishedNode: false,
    Name: name,
    metadata: { name },
    status: { images },
  };
}

function renderCell(node: NodeRowData) {
  const ctx = {
    row: { original: node },
  } as unknown as CellContext<NodeRowData, number>;

  const cellFn = cachedImages.cell as unknown as CellFn;
  function CellWrapper() {
    return <>{cellFn(ctx)}</>;
  }

  const Wrapped = withTestQueryProvider(CellWrapper);
  return render(<Wrapped />);
}

describe('cachedImages column', () => {
  describe('cell button', () => {
    it('shows the image count', () => {
      const node = makeNode([
        { names: ['nginx:latest'], sizeBytes: 100000000 },
        { names: ['redis:latest'], sizeBytes: 50000000 },
      ]);

      renderCell(node);

      expect(screen.getByRole('button', { name: /2/i })).toBeVisible();
    });

    it('shows zero when node has no cached images', () => {
      renderCell(makeNode([]));

      expect(screen.getByRole('button', { name: /0/i })).toBeVisible();
    });

    it('uses the node name in data-cy attribute', () => {
      renderCell(makeNode([], 'worker-1'));

      expect(
        document.querySelector('[data-cy="node-cached-images-worker-1"]')
      ).not.toBeNull();
    });
  });

  describe('modal', () => {
    it('opens when the button is clicked', async () => {
      const user = userEvent.setup();
      const node = makeNode([
        { names: ['nginx:latest'], sizeBytes: 100000000 },
      ]);

      renderCell(node);

      await user.click(screen.getByRole('button', { name: /1/i }));

      expect(
        screen.getByRole('dialog', { name: /Cached images on test-node/i })
      ).toBeVisible();
    });

    it('shows image names in the datatable', async () => {
      const user = userEvent.setup();
      const node = makeNode([
        { names: ['nginx:latest', 'nginx:1.21'], sizeBytes: 100000000 },
        { names: ['redis:latest'], sizeBytes: 50000000 },
      ]);

      renderCell(node);
      await user.click(screen.getByRole('button', { name: /2/i }));

      expect(screen.getByTitle('nginx:latest')).toBeVisible();
      expect(screen.getByTitle('redis:latest')).toBeVisible();
    });

    it('shows the empty-state message when the node has no images', async () => {
      const user = userEvent.setup();

      renderCell(makeNode([]));
      await user.click(screen.getByRole('button', { name: /0/i }));

      expect(
        screen.getByText('No cached images reported on this node.')
      ).toBeVisible();
    });

    it('shows <untagged> for images without names', async () => {
      const user = userEvent.setup();
      const node = makeNode([{ names: [], sizeBytes: 10000000 }]);

      renderCell(node);
      await user.click(screen.getByRole('button', { name: /1/i }));

      expect(screen.getByTitle('<untagged>')).toBeVisible();
    });

    it('shows the correct alias count', async () => {
      const user = userEvent.setup();
      // 3 names → primary + 2 aliases
      const node = makeNode([
        {
          names: ['nginx:latest', 'nginx:1.21', 'nginx:stable'],
          sizeBytes: 100000000,
        },
      ]);

      renderCell(node);
      await user.click(screen.getByRole('button', { name: /1/i }));

      expect(screen.getByText('2 aliases')).toBeVisible();
    });

    it('uses singular "alias" when there is exactly one alias', async () => {
      const user = userEvent.setup();
      const node = makeNode([
        { names: ['nginx:latest', 'nginx:1.21'], sizeBytes: 100000000 },
      ]);

      renderCell(node);
      await user.click(screen.getByRole('button', { name: /1/i }));

      expect(screen.getByText('1 alias')).toBeVisible();
    });
  });
});
