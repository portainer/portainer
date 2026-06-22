import { Meta } from '@storybook/react-webpack5';
import { Form, Formik } from 'formik';

import { withUserProvider } from '@/react/test-utils/withUserProvider';

import { GitForm, buildGitValidationSchema } from './GitForm';
import { DeployMethod, GitFormModel } from './types';

export default {
  component: GitForm,
  title: 'Components/Forms/GitForm',
} as Meta;

const WrappedComponent = withUserProvider(GitForm);

interface Args {
  isAdditionalFilesFieldVisible: boolean;
  isDockerStandalone: boolean;
  deployMethod: DeployMethod;
  isForcePullVisible: boolean;
}

export function Primary({
  deployMethod,
  isAdditionalFilesFieldVisible,
  isDockerStandalone,
  isForcePullVisible,
}: Args) {
  const initialValues: GitFormModel = {
    SourceId: 0,
    AdditionalFiles: [],
    RepositoryReferenceName: '',
    ComposeFilePathInRepository: '',
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={() => buildGitValidationSchema(deployMethod)}
      onSubmit={() => {}}
    >
      {({ values, errors, setValues }) => (
        <Form className="form-horizontal">
          <WrappedComponent
            value={values}
            errors={errors}
            onChange={(value) => setValues({ ...values, ...value })}
            isAdditionalFilesFieldVisible={isAdditionalFilesFieldVisible}
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
  isAutoUpdateVisible: true,
  isDockerStandalone: true,
  isForcePullVisible: true,
  deployMethod: 'compose',
};
