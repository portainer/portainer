import { SchemaOf, object, string, boolean } from 'yup';

import { BackupS3Settings } from './types';

export function validationSchema(): SchemaOf<BackupS3Settings> {
  return object({
    passwordProtect: boolean().default(false),
    password: string()
      .default('')
      .when('passwordProtect', {
        is: true,
        then: (schema) => schema.required('This field is required.'),
      }),
    scheduleAutomaticBackup: boolean().default(false),
    cronRule: string()
      .default('')
      .when('scheduleAutomaticBackup', {
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
    accessKeyID: string()
      .default('')
      .when('scheduleAutomaticBackup', {
        is: true,
        then: (schema) => schema.required('This field is required.'),
      }),
    secretAccessKey: string()
      .default('')
      .when('scheduleAutomaticBackup', {
        is: true,
        then: (schema) => schema.required('This field is required.'),
      }),
    region: string().default('').optional(),
    bucketName: string()
      .default('')
      .when('scheduleAutomaticBackup', {
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
