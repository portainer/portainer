import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { server } from '@/setup-tests/server';

import { Source } from './types';
import { GitSourceSelector } from './GitSourceSelector';

function renderComponent({
  value,
  sources = [],
}: {
  value?: Source['id'];
  sources?: Array<Pick<Source, 'id' | 'name'>>;
} = {}) {
  server.use(
    http.get('/api/gitops/sources', () =>
      HttpResponse.json(sources, {
        headers: {
          'x-total-count': String(sources.length),
          'x-total-available': String(sources.length),
        },
      })
    )
  );

  const Wrapped = withTestQueryProvider(
    withTestRouter(() => <GitSourceSelector value={value} onChange={vi.fn()} />)
  );

  return render(<Wrapped />);
}

describe('GitSourceSelector', () => {
  it('renders the source selector', async () => {
    renderComponent();

    expect(await screen.findByLabelText('Source')).toBeInTheDocument();
  });

  it('shows the create new source button', async () => {
    renderComponent();

    expect(
      await screen.findByTestId('create-source-button')
    ).toBeInTheDocument();
  });
});
