import { Field, useField } from 'formik';
import _ from 'lodash';

import { FormControl } from '@@/form-components/FormControl';
import { Select } from '@@/form-components/Input';
import { TextTip } from '@@/Tip/TextTip';

import { useSupportedAgentVersions } from '../queries/useSupportedAgentVersions';

import { FormValues } from './types';

/**
 * in-case agents don't have any version field, it means they are version less then 2.15.x or that they still not associated.
 */
const DEFAULT_MIN_VERSION = '2.14.10';

export function VersionSelect({
  minVersion = DEFAULT_MIN_VERSION,
}: {
  minVersion?: string;
}) {
  const [{ value: version }, { error }, { setValue }] =
    useField<FormValues['version']>('version');
  const supportedAgentVersionsQuery = useSupportedAgentVersions(minVersion, {
    onSuccess(versions) {
      if (versions.includes(version)) {
        return;
      }

      setValue(_.last(versions) || '');
    },
  });

  if (!supportedAgentVersionsQuery.data) {
    return null;
  }

  if (!supportedAgentVersionsQuery.data.length) {
    return (
      <FormControl label="Version">
        <TextTip>No supported versions available</TextTip>
      </FormControl>
    );
  }

  const supportedVersions = supportedAgentVersionsQuery.data.map((version) => ({
    label: version,
    value: version,
  }));

  return (
    <FormControl label="Version" errors={error} inputId="version-input">
      <Field
        id="version-input"
        name="version"
        as={Select}
        className="form-control"
        placeholder="Version"
        options={supportedVersions}
      />
    </FormControl>
  );
}
