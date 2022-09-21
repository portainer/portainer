import { Field, useField } from 'formik';
import _ from 'lodash';

import { FormControl } from '@@/form-components/FormControl';
import { Select } from '@@/form-components/Input';
import { TextTip } from '@@/Tip/TextTip';

import { useSupportedAgentVersions } from '../queries/useSupportedAgentVersions';

import { FormValues } from './types';

export function VersionSelect({ minVersion }: { minVersion?: string }) {
  const [, { error }, { setValue }] =
    useField<FormValues['version']>('version');
  const supportedAgentVersionsQuery = useSupportedAgentVersions(minVersion, {
    onSuccess(versions) {
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
