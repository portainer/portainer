import { object, string, boolean } from 'yup';

export function validationSchema() {
  return object().shape({
    passwordProtect: boolean(),
    password: string().when('passwordProtect', {
      is: true,
      then: (schema) => schema.required('This field is required.'),
    }),
    scheduleAutomaticBackup: boolean(),
    cronRule: string().when('scheduleAutomaticBackup', {
      is: true,
      then: (schema) =>
        schema.required('This field is required.').when('cronRule', {
          is: (val: string) => val !== '',
          then: (schema) =>
            schema.matches(
              /^(\*(\/[1-9][0-9]*)?|([0-5]?[0-9]|6[0-9]|7[0-9])(-[0-5]?[0-9])?)(\s+(\*(\/[1-9][0-9]*)?|([0-5]?[0-9]|6[0-9]|7[0-9])(-[0-5]?[0-9])?)){4}$/,
              'Please enter a valid cron rule.'
            ),
        }),
    }),
    accessKeyID: string().when('scheduleAutomaticBackup', {
      is: true,
      then: (schema) => schema.required('This field is required.'),
    }),
    secretAccessKey: string().when('scheduleAutomaticBackup', {
      is: true,
      then: (schema) => schema.required('This field is required.'),
    }),
    bucketName: string().when('scheduleAutomaticBackup', {
      is: true,
      then: (schema) => schema.required('This field is required.'),
    }),
    s3CompatibleHost: string()
      .default('')
      .when({
        is: (val: string) => val !== '',
        then: (schema) =>
          schema.matches(
            /^https?:\/\//,
            'S3 host must begin with http:// or https://.'
          ),
      }),
  });
}
