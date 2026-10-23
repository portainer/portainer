import { useFormikContext } from 'formik';

import { FormSection } from '@@/form-components/FormSection';

import { GitAuthentication } from '../../components/GitAuthentication';
import { FormValues } from '../type';

export function Authentication() {
  const { values, setValues, errors } = useFormikContext<FormValues>();

  if (values.type !== 'git') {
    return null;
  }

  const { authentication } = values.git;

  return (
    <FormSection title="Authentication">
      <GitAuthentication
        values={authentication}
        errors={errors.git?.authentication}
        onChange={(changed) =>
          setValues((old) => ({
            ...old,
            git: {
              ...old.git,
              authentication: { ...old.git.authentication, ...changed },
            },
          }))
        }
        toggleDataCy="git-auth-toggle"
      />
    </FormSection>
  );
}
