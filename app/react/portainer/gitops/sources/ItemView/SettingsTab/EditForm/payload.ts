import { UpdateSourcePayload } from '../../../queries/useUpdateSourceMutation';

import { SettingsFormValues } from './types';

export function buildUpdatePayload(
  values: SettingsFormValues,
  initialValues: SettingsFormValues
): UpdateSourcePayload {
  return {
    name: changed(values.name, initialValues.name),
    url: changed(values.url, initialValues.url),
    tlsSkipVerify: changed(values.tlsSkipVerify, initialValues.tlsSkipVerify),
    authentication: buildAuthenticationPayload(values, initialValues),
    interval: changed(
      values.pollingEnabled ? values.interval : '',
      initialValues.interval
    ),
  };
}

function buildAuthenticationPayload(
  values: SettingsFormValues,
  initialValues: SettingsFormValues
) {
  if (!values.authEnabled && initialValues.authEnabled) {
    return {};
  }

  if (!values.authEnabled) {
    return undefined;
  }

  const payload = {
    username: changed(values.username, initialValues.username),
    password: changed(values.password, initialValues.password),
  };

  return Object.values(payload).some((v) => v !== undefined)
    ? payload
    : undefined;
}

function changed<T>(value: T, initialValue: T) {
  return value === initialValue ? undefined : value;
}
