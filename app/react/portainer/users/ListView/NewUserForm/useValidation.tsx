import { SchemaOf, array, boolean, number, object, ref, string } from 'yup';
import { useMemo } from 'react';

import { usePublicSettings } from '@/react/portainer/settings/queries';
import { AuthenticationMethod } from '@/react/portainer/settings/types';
import { useUsers } from '@/portainer/users/queries';

import { FormValues } from './FormValues';

export function useValidation(): SchemaOf<FormValues> {
  const usersQuery = useUsers(true);
  const settingsQuery = usePublicSettings();

  const authMethod =
    settingsQuery.data?.AuthenticationMethod ?? AuthenticationMethod.Internal;

  return useMemo(() => {
    const users = usersQuery.data ?? [];

    const base = object({
      username: string()
        .required('Username is required')
        .test({
          name: 'unique',
          message: 'Username is already taken',
          test: (value) => users.every((u) => u.Username !== value),
        }),
      password: string().default(''),
      confirmPassword: string().default(''),
      isAdmin: boolean().default(false),
      teams: array(number().required()).required(),
    });

    if (authMethod === AuthenticationMethod.Internal) {
      return base.concat(
        passwordValidation(settingsQuery.data?.RequiredPasswordLength)
      );
    }

    return base;
  }, [authMethod, settingsQuery.data?.RequiredPasswordLength, usersQuery.data]);
}

function passwordValidation(minLength: number | undefined = 12) {
  return object({
    password: string()
      .required('Password is required')
      .min(
        minLength,
        ({ value, min }) =>
          `The password must be at least ${min} characters long. (${value.length}/${min})`
      ),
    confirmPassword: string().oneOf(
      [ref('password'), null],
      'Passwords must match'
    ),
  });
}
