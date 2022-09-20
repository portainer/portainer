import { Field, useField } from 'formik';
import _ from 'lodash';

import { FormControl } from '@@/form-components/FormControl';
import { Select } from '@@/form-components/Input';
import { Option } from '@@/form-components/Input/Select';

import { useSupportedAgentVersions } from '../queries/useSupportedAgentVersions';

import { FormValues } from './types';

export function VersionSelect() {
  const [, { error }, { setValue }] =
    useField<FormValues['version']>('version');
  const supportedAgentVersionsQuery = useSupportedAgentVersions<
    Option<string>[]
  >({
    select: (versions) =>
      versions.map((version) => ({ label: version, value: version })),
    onSuccess(versions) {
      if (versions.length > 0) {
        setValue(_.last(versions)?.value || '');
      }
    },
  });

  if (!supportedAgentVersionsQuery.data) {
    return null;
  }

  const supportedVersions = supportedAgentVersionsQuery.data;

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
