import { boolean, object, string } from 'yup';

export function validation() {
  return object({
    name: string().required('This field is required.'),
    overridePath: boolean(),
    socketPath: string().when('overridePath', (overridePath, schema) =>
      overridePath
        ? schema.required(
            'Socket Path is required when override path is enabled'
          )
        : schema
    ),
  });
}
