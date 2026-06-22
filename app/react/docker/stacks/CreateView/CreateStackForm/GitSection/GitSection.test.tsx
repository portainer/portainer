import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';

import { mockFormValues } from '../test-utils';

import { GitSection } from './GitSection';
import { GitFormValues } from './types';

describe('GitSection', () => {
  it('should render the git repository section', () => {
    renderComponent();

    expect(screen.getByText('Git repository')).toBeInTheDocument();
  });

  it('should render the source selector', () => {
    renderComponent();

    expect(screen.getByText('Source')).toBeInTheDocument();
  });

  it('should render with auto update enabled', () => {
    renderComponent({
      webhookId: 'webhookId',
      initialValues: {
        AutoUpdate: {
          RepositoryAutomaticUpdates: true,
          RepositoryMechanism: 'Interval' as const,
          RepositoryFetchInterval: '5m',
          ForcePullImage: false,
          RepositoryAutomaticUpdatesForce: false,
        },
      },
    });

    expect(screen.getByText('Git repository')).toBeInTheDocument();
  });

  it('should render with docker standalone flag', () => {
    renderComponent({ isDockerStandalone: true });

    expect(screen.getByText('Git repository')).toBeInTheDocument();
  });
});

function renderComponent({
  webhookId = 'webhook',
  initialValues,
  isDockerStandalone,
}: {
  webhookId?: string;
  isDockerStandalone?: boolean;
  initialValues?: Partial<GitFormValues>;
} = {}) {
  const values = mockFormValues({
    method: 'repository',
    git: {
      SourceId: 0,
      RepositoryReferenceName: 'refs/heads/main',
      ComposeFilePathInRepository: 'docker-compose.yml',
      AdditionalFiles: [],
      AutoUpdate: undefined,
      SupportRelativePath: false,
      FilesystemPath: '',
      ...initialValues,
    },
  });

  const Wrapped = withTestRouter(
    withUserProvider(
      withTestQueryProvider(() => (
        <Formik initialValues={values} onSubmit={() => {}} validateOnMount>
          <GitSection
            webhookId={webhookId}
            isDockerStandalone={isDockerStandalone}
          />
        </Formik>
      ))
    )
  );

  return render(<Wrapped />);
}
