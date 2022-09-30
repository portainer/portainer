import { Field, Form, Formik } from 'formik';

import { LoadingButton } from '@@/buttons/LoadingButton';
import { FormControl } from '@@/form-components/FormControl';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { Input } from '@@/form-components/Input';
import { Button } from '@@/buttons';
import { TextTip } from '@@/Tip/TextTip';

const initialValues = {
  kubeConfig: '',
  name: '',
  meta: {
    groupId: 1,
    tagIds: [],
  },
};

export function KubeConfigTeaserForm() {
  return (
    <Formik initialValues={initialValues} onSubmit={() => {}} validateOnMount>
      {() => (
        <Form className="mt-5">
          <FormSectionTitle>Environment details</FormSectionTitle>

          <div className="form-group">
            <div className="col-sm-12">
              <TextTip color="blue">
                <span className="text-muted">
                  <a
                    href="https://docs.portainer.io/start/install/agent/kubernetes/import"
                    target="_blank"
                    rel="noreferrer"
                    className="mx-1"
                  >
                    Import the kubeconfig file
                  </a>
                  of an existing Kubernetes cluster located on-premise or on a
                  cloud platform. This will create a corresponding environment
                  in Portainer and install the agent on the cluster. Please
                  ensure:
                </span>
              </TextTip>
            </div>
            <div className="col-sm-12 text-muted small">
              <ul className="p-2 pl-4">
                <li>You have a load balancer enabled in your cluster</li>
                <li>You specify current-context in your kubeconfig</li>
                <li>
                  The kubeconfig is self-contained - including any required
                  credentials.
                </li>
              </ul>
              <p>
                Note: Officially supported cloud providers are Civo, Linode,
                DigitalOcean and Microsoft Azure (others are not guaranteed to
                work at present)
              </p>
            </div>
          </div>

          <FormControl label="Name" required>
            <Field
              name="name"
              as={Input}
              data-cy="endpointCreate-nameInput"
              placeholder="e.g. docker-prod01 / kubernetes-cluster01"
              readOnly
            />
          </FormControl>

          <FormControl
            label="Kubeconfig file"
            required
            inputId="kubeconfig_file"
          >
            <Button disabled>Select a file</Button>
          </FormControl>

          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                className="wizard-connect-button"
                loadingText="Connecting environment..."
                isLoading={false}
                disabled
              >
                <i className="fa fa-plug" aria-hidden="true" /> Connect
              </LoadingButton>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}
