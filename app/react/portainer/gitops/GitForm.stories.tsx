import { Meta } from '@storybook/react';
import { Form, Formik } from 'formik';
import { http, HttpResponse } from 'msw';

import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { GitCredential } from '@/react/portainer/account/git-credentials/types';

import { GitForm, buildGitValidationSchema } from './GitForm';
import { DeployMethod, GitFormModel } from './types';

export default {
  component: GitForm,
  title: 'Forms/GitForm',
  parameters: {
    msw: {
      handlers: [
        http.get<{ userId: string }, Array<GitCredential>>(
          '/api/users/:userId/gitcredentials',
          ({ params }) =>
            HttpResponse.json([
              {
                id: 1,
                name: 'credential-1',
                username: 'username-1',
                userId: parseInt(params.userId, 10),
                creationDate: 0,
              },
              {
                id: 2,
                name: 'credential-2',
                username: 'username-2',
                userId: parseInt(params.userId, 10),
                creationDate: 0,
              },
            ])
        ),
      ],
    },
  },
} as Meta;

const WrappedComponent = withUserProvider(GitForm);

interface Args {
  isAdditionalFilesFieldVisible: boolean;
  isAuthExplanationVisible: boolean;
  isDockerStandalone: boolean;
  deployMethod: DeployMethod;
  isForcePullVisible: boolean;
}

export function Primary({
  deployMethod,
  isAdditionalFilesFieldVisible,
  isAuthExplanationVisible,
  isDockerStandalone,
  isForcePullVisible,
}: Args) {
  const initialValues: GitFormModel = {
    RepositoryURL: '',
    RepositoryURLValid: false,
    RepositoryAuthentication: false,
    RepositoryUsername: '',
    RepositoryPassword: '',
    AdditionalFiles: [],
    RepositoryReferenceName: '',
    ComposeFilePathInRepository: '',
    NewCredentialName: '',
    SaveCredential: false,
    TLSSkipVerify: false,
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={() => buildGitValidationSchema([], false, 'compose')}
      onSubmit={() => {}}
    >
      {({ values, errors, setValues }) => (
        <Form className="form-horizontal">
          <WrappedComponent
            value={values}
            errors={errors}
            onChange={(value) => setValues({ ...values, ...value })}
            isAdditionalFilesFieldVisible={isAdditionalFilesFieldVisible}
            isAuthExplanationVisible={isAuthExplanationVisible}
            isDockerStandalone={isDockerStandalone}
            isForcePullVisible={isForcePullVisible}
            deployMethod={deployMethod}
            baseWebhookUrl="ws://localhost:9000"
            webhookId="1234"
          />
        </Form>
      )}
    </Formik>
  );
}

Primary.args = {
  isAdditionalFilesFieldVisible: true,
  isAuthExplanationVisible: true,
  isAutoUpdateVisible: true,
  isDockerStandalone: true,
  isForcePullVisible: true,
  deployMethod: 'compose',
};
