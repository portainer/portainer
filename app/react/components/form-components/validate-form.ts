import { yupToFormErrors } from 'formik';
import { SchemaOf } from 'yup';

export async function validateForm<T>(
  schemaBuilder: () => SchemaOf<T>,
  formValues: T
) {
  const validationSchema = schemaBuilder();

  try {
    await validationSchema.validate(formValues, {
      strict: true,
      abortEarly: false,
    });
    return undefined;
  } catch (error) {
    return yupToFormErrors<T>(error);
  }
}
