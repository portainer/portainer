import { useEffect, useState } from 'react';
import { FormikErrors, yupToFormErrors } from 'formik';

import { RelativePathModel } from '@/react/portainer/gitops/types';
import { relativePathValidation } from '@/react/portainer/gitops/RelativePathFieldset/validation';

export function useValidation(value: RelativePathModel) {
  const [errors, setErrors] = useState<FormikErrors<RelativePathModel>>({});

  useEffect(() => {
    async function valide() {
      try {
        await relativePathValidation().validate(value, {
          strict: true,
          abortEarly: false,
        });
        setErrors({});
      } catch (error) {
        setErrors(yupToFormErrors(error));
      }
    }

    valide();
  }, [value]);

  return { errors };
}
