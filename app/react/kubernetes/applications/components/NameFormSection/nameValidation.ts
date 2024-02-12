import { SchemaOf, string as yupString } from 'yup';

type ValidationData = {
  existingNames: string[];
  isEdit: boolean;
  originalName?: string;
};

export function appNameValidation(
  validationData?: ValidationData
): SchemaOf<string> {
  return yupString()
    .required('This field is required.')
    .test(
      'is-unique',
      'An application with the same name already exists inside the selected namespace.',
      (appName) => {
        if (!validationData || !appName) {
          return true;
        }
        // if creating, check if the name is unique
        if (!validationData.isEdit) {
          return !validationData.existingNames.includes(appName);
        }
        // if editing, the original name will be in the list of existing names
        // remove it before checking if the name is unique
        const updatedExistingNames = validationData.existingNames.filter(
          (name) => name !== validationData.originalName
        );
        return !updatedExistingNames.includes(appName);
      }
    )
    .test(
      'is-valid',
      "This field must consist of lower case alphanumeric characters or '-', contain at most 63 characters, start with an alphabetic character, and end with an alphanumeric character (e.g. 'my-name', or 'abc-123').",
      (appName) => {
        if (!appName) {
          return true;
        }
        return /^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/g.test(appName);
      }
    );
}
