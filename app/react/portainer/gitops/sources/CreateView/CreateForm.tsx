import { Form, Formik, FormikHelpers } from 'formik';
import { useRouter } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';
import { ResourceControlOwnership } from '@/react/portainer/access-control/types';
import { useIsPureAdmin } from '@/react/hooks/useUser';

import { Widget } from '@@/Widget';

import { FormValues, formValuesToCreatePayload } from './type';
import { useCreateSourceMutation } from './useSourceCreateMutation';
import { WizardStep, useWizardContext } from './WizardContext';
import { WizardHeader } from './WizardHeader';
import { WizardFooter } from './WizardFooter';

type Props = {
  steps: WizardStep[];
};

export function CreateForm({ steps }: Props) {
  const isAdmin = useIsPureAdmin();
  const mutation = useCreateSourceMutation();
  const router = useRouter();
  const { currentStep, isLastStep, goToNextStep } = useWizardContext();

  const initialFormValues: FormValues = {
    name: '',
    type: 'git',
    git: {
      url: '',
      authentication: {
        authEnabled: true,
      },
      connectionOk: false,
    },
    authorizedTeams: [],
    authorizedUsers: [],
    ownership: isAdmin
      ? ResourceControlOwnership.ADMINISTRATORS
      : ResourceControlOwnership.PRIVATE,
  };

  return (
    <Formik
      initialValues={initialFormValues}
      onSubmit={handleSubmit}
      validationSchema={currentStep.validateStep}
    >
      <Form noValidate>
        <WizardHeader steps={steps} />
        <Widget>
          <currentStep.component />
        </Widget>
        <WizardFooter />
      </Form>
    </Formik>
  );

  function handleSubmit(
    formValues: FormValues,
    { setTouched, setSubmitting }: FormikHelpers<FormValues>
  ) {
    if (!isLastStep) {
      goToNextStep();
      setTouched({});
      setSubmitting(false);
      return;
    }

    mutation.mutate(formValuesToCreatePayload(formValues), {
      onSuccess: () => {
        notifySuccess('Success', 'Source successfully created');
        router.stateService.go('.^');
      },
      onSettled: () => setSubmitting(false),
    });
  }
}
