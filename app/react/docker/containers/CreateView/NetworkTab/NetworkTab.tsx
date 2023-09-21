import { FormikErrors } from 'formik';
import { useState } from 'react';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { InputList, ItemProps } from '@@/form-components/InputList';
import { InputGroup } from '@@/form-components/InputGroup';
import { FormError } from '@@/form-components/FormError';

import { NetworkSelector } from '../../components/NetworkSelector';

import { CONTAINER_MODE, Values } from './types';
import { ContainerSelector } from './ContainerSelector';

export function NetworkTab({
  values: initialValues,
  onChange,
  errors,
}: {
  values: Values;
  onChange(values: Values): void;
  errors?: FormikErrors<Values>;
}) {
  const [values, setControlledValues] = useState(initialValues);

  return (
    <div className="mt-3">
      <FormControl label="Network" errors={errors?.networkMode}>
        <NetworkSelector
          value={values.networkMode}
          additionalOptions={[{ label: 'Container', value: CONTAINER_MODE }]}
          onChange={(networkMode) => handleChange({ networkMode })}
        />
      </FormControl>

      {values.networkMode === CONTAINER_MODE && (
        <FormControl label="Container" errors={errors?.container}>
          <ContainerSelector
            value={values.container}
            onChange={(container) => handleChange({ container })}
          />
        </FormControl>
      )}

      <FormControl label="Hostname" errors={errors?.hostname}>
        <Input
          value={values.hostname}
          onChange={(e) => handleChange({ hostname: e.target.value })}
          placeholder="e.g. web01"
        />
      </FormControl>

      <FormControl label="Domain Name" errors={errors?.domain}>
        <Input
          value={values.domain}
          onChange={(e) => handleChange({ domain: e.target.value })}
          placeholder="e.g. example.com"
        />
      </FormControl>

      <FormControl label="MAC Address" errors={errors?.macAddress}>
        <Input
          value={values.macAddress}
          onChange={(e) => handleChange({ macAddress: e.target.value })}
          placeholder="e.g. 12-34-56-78-9a-bc"
        />
      </FormControl>

      <FormControl label="IPv4 Address" errors={errors?.ipv4Address}>
        <Input
          value={values.ipv4Address}
          onChange={(e) => handleChange({ ipv4Address: e.target.value })}
          placeholder="e.g. 172.20.0.7"
        />
      </FormControl>

      <FormControl label="IPv6 Address" errors={errors?.ipv6Address}>
        <Input
          value={values.ipv6Address}
          onChange={(e) => handleChange({ ipv6Address: e.target.value })}
          placeholder="e.g. a:b:c:d::1234"
        />
      </FormControl>

      <FormControl label="Primary DNS Server" errors={errors?.primaryDns}>
        <Input
          value={values.primaryDns}
          onChange={(e) => handleChange({ primaryDns: e.target.value })}
          placeholder="e.g. 1.1.1.1, 2606:4700:4700::1111"
        />
      </FormControl>

      <FormControl label="Secondary DNS Server" errors={errors?.secondaryDns}>
        <Input
          value={values.secondaryDns}
          onChange={(e) => handleChange({ secondaryDns: e.target.value })}
          placeholder="e.g. 1.0.0.1, 2606:4700:4700::1001"
        />
      </FormControl>

      <InputList
        label="Hosts file entries"
        value={values.hostsFileEntries}
        onChange={(hostsFileEntries) => handleChange({ hostsFileEntries })}
        errors={errors?.hostsFileEntries}
        item={HostsFileEntryItem}
      />
    </div>
  );

  function handleChange(newValues: Partial<Values>) {
    onChange({ ...values, ...newValues });
    setControlledValues((values) => ({ ...values, ...newValues }));
  }
}

function HostsFileEntryItem({
  item,
  onChange,
  disabled,
  error,
  readOnly,
}: ItemProps<string>) {
  return (
    <div>
      <InputGroup>
        <InputGroup.Addon>value</InputGroup.Addon>
        <Input
          value={item}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
        />
      </InputGroup>

      {error && <FormError>{error}</FormError>}
    </div>
  );
}
