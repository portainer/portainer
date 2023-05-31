import { yupToFormErrors } from 'formik';
import { SchemaOf } from 'yup';

export async function validateForm<T>(
  schemaBuilder: () => SchemaOf<T>,
  formValues: T,
  validationContext?: object
) {
  const validationSchema = schemaBuilder();

  try {
    await validationSchema.validate(formValues, {
      strict: true,
      abortEarly: false,
      // workaround to access all parents for nested fields. See clusterIpFormValidation for a use case.
      context: { formValues, validationContext },
    });
    return undefined;
  } catch (error) {
    return yupToFormErrors<T>(error);
  }
}
