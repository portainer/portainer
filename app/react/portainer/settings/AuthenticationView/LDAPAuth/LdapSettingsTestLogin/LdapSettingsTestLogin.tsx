import { Field, Form, Formik } from 'formik';
import { Check, X } from 'lucide-react';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { LDAPSettings } from '@/react/portainer/settings/types';

import { BEFeatureIndicator } from '@@/BEFeatureIndicator';
import { FormSection } from '@@/form-components/FormSection';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { LoadingButton } from '@@/buttons';

import { useTestLdapMutation } from '../../../queries/auth/useTestLdap';

interface Props {
  settings: LDAPSettings;
  limitedFeatureId?: FeatureId;
  showBeIndicatorIfNeeded?: boolean;
  isLimitedFeatureSelfContained?: boolean;
}

const initialValues = { username: '', password: '' };

export function LdapSettingsTestLogin({
  settings,
  limitedFeatureId,
  showBeIndicatorIfNeeded = false,
  isLimitedFeatureSelfContained = false,
}: Props) {
  const isDisabled =
    isLimitedFeatureSelfContained || isLimitedToBE(limitedFeatureId);
  const mutation = useTestLdapMutation();

  return (
    <FormSection title="Test login">
      <Formik
        initialValues={initialValues}
        onSubmit={({ username, password }) =>
          mutation.mutate({ username, password, settings })
        }
      >
        {({ values }) => (
          <Form noValidate>
            <div className="form-inline mb-4 flex gap-3">
              <FormControl
                label="Username"
                inputId="ldap_test_username"
                size="medium"
              >
                <Field
                  as={Input}
                  id="ldap_test_username"
                  name="username"
                  disabled={isDisabled}
                  className={
                    isLimitedFeatureSelfContained ? 'limited-be' : undefined
                  }
                  data-cy="ldap-test-username"
                />
              </FormControl>

              <FormControl
                label="Password"
                inputId="ldap_test_password"
                size="medium"
              >
                <Field
                  as={Input}
                  id="ldap_test_password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  disabled={isDisabled}
                  className={
                    isLimitedFeatureSelfContained ? 'limited-be' : undefined
                  }
                  data-cy="ldap-test-password"
                />
              </FormControl>

              <div className="vertical-center">
                <LoadingButton
                  isLoading={mutation.isLoading}
                  disabled={isDisabled || !values.username || !values.password}
                  loadingText="Testing"
                  data-cy="ldap-test-button"
                  className={
                    isLimitedFeatureSelfContained ? 'limited-be' : undefined
                  }
                >
                  Test
                </LoadingButton>

                {mutation.isSuccess && mutation.data?.valid && (
                  <Check className="icon-success" aria-hidden="true" />
                )}

                {(mutation.isError ||
                  (mutation.isSuccess && !mutation.data?.valid)) && (
                  <X className="icon-danger" aria-hidden="true" />
                )}

                {showBeIndicatorIfNeeded && limitedFeatureId && (
                  <BEFeatureIndicator featureId={limitedFeatureId} />
                )}
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </FormSection>
  );
}
