import { object, string, boolean } from 'yup';

export function validationSchema() {
  return object().shape({
    PasswordProtect: boolean(),
    Password: string().when('PasswordProtect', {
      is: true,
      then: (schema) => schema.required('This field is required.'),
    }),
    PasswordProtectS3: boolean(),
    PasswordS3: string().when('PasswordProtectS3', {
      is: true,
      then: (schema) => schema.required('This field is required.'),
    }),
    ScheduleAutomaticBackup: boolean(),
    CronRule: string().when('ScheduleAutomaticBackup', {
      is: true,
      then: (schema) =>
        schema.required('This field is required.').when('CronRule', {
          is: (val) => val !== '',
          then: (schema) =>
            schema.matches(
              /^(\*(\/[1-9][0-9]*)?|([0-5]?[0-9]|6[0-9]|7[0-9])(-[0-5]?[0-9])?)(\s+(\*(\/[1-9][0-9]*)?|([0-5]?[0-9]|6[0-9]|7[0-9])(-[0-5]?[0-9])?)){4}$/,
              'Please enter a valid cron rule.'
            ),
        }),
    }),
    AccessKeyID: string().when('ScheduleAutomaticBackup', {
      is: true,
      then: (schema) => schema.required('This field is required.'),
    }),
    SecretAccessKey: string().when('ScheduleAutomaticBackup', {
      is: true,
      then: (schema) => schema.required('This field is required.'),
    }),
    BucketName: string().when('ScheduleAutomaticBackup', {
      is: true,
      then: (schema) => schema.required('This field is required.'),
    }),
    S3CompatibleHost: string()
      .nullable()
      .when({
        is: (val) => val !== '',
        then: (schema) =>
          schema.matches(
            /^https?:\/\//,
            'S3 host must begin with http:// or https://.'
          ),
      }),
  });
}
