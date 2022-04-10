import { Field, Form, Formik } from 'formik';
import * as yup from 'yup';
import { useMutation } from 'react-query';

import { LoadingButton } from '@/portainer/components/Button/LoadingButton';
import { FormControl } from '@/portainer/components/form-components/FormControl';
import { FormSectionTitle } from '@/portainer/components/form-components/FormSectionTitle';
import { Input } from '@/portainer/components/form-components/Input';
import { useLocalStorage } from '@/portainer/hooks/useLocalStorage';
import { generateKey } from '@/portainer/environments/environment.service/edge';
import { baseHref } from '@/portainer/helpers/pathHelper';

interface FormValues {
  url: string;
}

interface Props {
  onCreate: (edgeKey: string) => void;
}

export function EdgeKeyGeneration({ onCreate }: Props) {
  const validation = yup.object({
    url: yup
      .string()
      .url('URL should be a valid URI')
      .required('URL is required'),
  });

  const [defaultUrl, setDefaultUrl] = useLocalStorage(
    'edge-portainer-url',
    buildDefaultUrl()
  );

  const mutation = useGenerateKeyMutation();

  return (
    <Formik<FormValues>
      initialValues={{ url: defaultUrl }}
      onSubmit={handleSubmit}
      validationSchema={validation}
    >
      {({ errors, isValid, touched }) => (
        <Form className="form-horizontal">
          <FormSectionTitle>Edge Key Generation</FormSectionTitle>

          <FormControl
            label="Portainer URL"
            tooltip="URL of the Portainer instance that the agent will use to initiate the communications."
            inputId="url-input"
            errors={touched.url && errors.url}
          >
            <Field as={Input} id="url-input" name="url" />
          </FormControl>

          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                loadingText="generating..."
                isLoading={mutation.isLoading}
                disabled={!isValid}
              >
                Generate Key
              </LoadingButton>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );

  function handleSubmit(values: FormValues) {
    setDefaultUrl(values.url);

    mutation.mutate(values.url, {
      onSuccess(data) {
        onCreate(data.edgeKey);
      },
    });
  }
}

function useGenerateKeyMutation() {
  return useMutation((url: string) => generateKey(url), {
    meta: {
      error: {
        title: 'Failure',
        message: 'Failed generating key',
      },
    },
  });
}

function buildDefaultUrl() {
  const baseHREF = baseHref();
  return window.location.origin + (baseHREF !== '/' ? baseHREF : '');
}
