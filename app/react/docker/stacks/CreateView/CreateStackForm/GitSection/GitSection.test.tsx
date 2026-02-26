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

  it('should render authentication toggle', () => {
    renderComponent();

    expect(screen.getByText('Authentication')).toBeInTheDocument();
  });

  it('should render TLS skip verification toggle', () => {
    renderComponent();

    expect(screen.getByText('Skip TLS Verification')).toBeInTheDocument();
  });

  it('should render with git authentication enabled', () => {
    renderComponent({
      initialValues: {
        RepositoryAuthentication: true,
        RepositoryUsername: 'testuser',
      },
    });

    expect(screen.getByText('Authentication')).toBeInTheDocument();
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
      RepositoryURL: '',
      RepositoryReferenceName: 'refs/heads/main',
      ComposeFilePathInRepository: 'docker-compose.yml',
      RepositoryAuthentication: false,
      RepositoryUsername: '',
      RepositoryPassword: '',
      RepositoryGitCredentialID: 0,
      TLSSkipVerify: false,
      AdditionalFiles: [],
      AutoUpdate: undefined,
      RepositoryAuthorizationType: undefined,
      SupportRelativePath: false,
      FilesystemPath: '',
      SaveCredential: false,
      NewCredentialName: '',
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
