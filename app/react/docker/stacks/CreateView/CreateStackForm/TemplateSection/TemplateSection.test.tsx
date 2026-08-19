import { render, screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { HttpResponse } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { http, server } from '@/setup-tests/server';
import { withTestRouter } from '@/react/test-utils/withRouter';

import { mockFormValues } from '../test-utils';

import { TemplateSection } from './TemplateSection';
import { TemplateFormValues } from './types';

beforeEach(() => {
  server.use(
    http.get('/api/custom_templates', () =>
      HttpResponse.json([
        {
          Id: 1,
          Title: 'Test Template',
          Description: 'A test template',
          Note: 'This is a test note',
          Variables: [
            {
              name: 'VAR1',
              label: 'Variable 1',
              description: 'First variable',
              default: 'default1',
            },
          ],
        },
        {
          Id: 2,
          Title: 'Another Template',
          Description: 'Another test template',
          Note: '',
          Variables: [],
        },
      ])
    ),
    http.get('/api/custom_templates/:id', () => HttpResponse.json({})),
    http.get('/api/custom_templates/:id/file', () =>
      HttpResponse.json({
        FileContent: 'version: "3"\nservices:\n  web:\n    image: nginx',
      })
    )
  );
});

describe('TemplateSection', () => {
  it('should render the template section', async () => {
    server.use(http.get('/api/custom_templates', () => HttpResponse.json([])));
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/No custom templates are available/)
      ).toBeInTheDocument();
    });
  });

  it('should render template selector', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Select a custom template/)).toBeInTheDocument();
    });
  });

  it('should show loading indicator when loading template', async () => {
    server.use(
      http.get('/api/custom_templates/:id', async () => {
        await new Promise(() => {});
        return HttpResponse.json({});
      })
    );
    renderComponent({
      initialValues: {
        selectedId: 1,
        variables: [],
        fileContent: '',
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Loading template...')).toBeInTheDocument();
    });
  });
});

function renderComponent({
  initialValues = {},
  isSwarm = false,
}: { initialValues?: Partial<TemplateFormValues>; isSwarm?: boolean } = {}) {
  const values = mockFormValues({
    method: 'template',
    template: {
      selectedId: undefined,
      variables: [],
      fileContent: '',
      ...initialValues,
    },
  });

  const Wrapped = withTestRouter(
    withUserProvider(
      withTestQueryProvider(() => (
        <Formik initialValues={values} onSubmit={() => {}} validateOnMount>
          <TemplateSection isSwarm={isSwarm} isSaved={false} />
        </Formik>
      ))
    )
  );

  return render(<Wrapped />);
}
