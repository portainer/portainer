import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';

import { withTestRouter } from '@/react/test-utils/withRouter';

import { mockFormValues } from '../test-utils';

import { EditorFormValues } from './types';
import { EditorSection } from './EditorSection';

describe('EditorSection', () => {
  it('should render the component', () => {
    renderComponent();

    expect(screen.getByText('Web editor')).toBeInTheDocument();
    expect(
      screen.getByText(/You can get more information about Compose file format/)
    ).toBeInTheDocument();

    const editor = screen.getByTestId('stack-creation-editor');
    expect(editor).toBeInTheDocument();

    const link = screen.getByRole('link', {
      name: /official documentation/i,
    });
    expect(link).toHaveAttribute(
      'href',
      'https://docs.docker.com/reference/compose-file/'
    );
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('should render with initial file content', () => {
    const value = 'version: "3"\nservices:\n  web:\n    image: nginx';
    renderComponent({
      initialValues: {
        fileContent: value,
      },
    });

    const editor = screen.getByTestId('stack-creation-editor');
    expect(editor).toBeInTheDocument();

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue(value);
  });
});

function renderComponent({
  initialValues,
  isSwarm = false,
}: { initialValues?: Partial<EditorFormValues>; isSwarm?: boolean } = {}) {
  const values = mockFormValues({
    method: 'editor',
    editor: {
      fileContent: '',
      ...initialValues,
    },
  });

  const Wrapped = withTestRouter(EditorSection);

  return render(
    <Formik initialValues={values} onSubmit={() => {}} validateOnMount>
      <Wrapped isSwarm={isSwarm} isSaved={false} />
    </Formik>
  );
}
