import { FormikErrors } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { InputList, ItemProps } from '@@/form-components/InputList';
import { InputGroup } from '@@/form-components/InputGroup';
import { FormError } from '@@/form-components/FormError';

import { NetworkSelector } from '../../components/NetworkSelector';

import { CONTAINER_MODE, Values } from './types';
import { ContainerSelector } from './ContainerSelector';

export function NetworkTab({
  values,
  setFieldValue,
  errors,
}: {
  values: Values;
  setFieldValue: (field: string, value: unknown) => void;
  errors?: FormikErrors<Values>;
}) {
  return (
    <div className="mt-3">
      <FormControl label="Network" errors={errors?.networkMode}>
        <NetworkSelector
          value={values.networkMode}
          additionalOptions={[{ label: 'Container', value: CONTAINER_MODE }]}
          onChange={(networkMode) => setFieldValue('networkMode', networkMode)}
        />
      </FormControl>

      {values.networkMode === CONTAINER_MODE && (
        <FormControl label="Container" errors={errors?.container}>
          <ContainerSelector
            value={values.container}
            onChange={(container) => setFieldValue('container', container)}
          />
        </FormControl>
      )}

      <FormControl label="Hostname" errors={errors?.hostname}>
        <Input
          value={values.hostname}
          onChange={(e) => setFieldValue('hostname', e.target.value)}
          placeholder="e.g. web01"
          data-cy="docker-container-hostname-input"
        />
      </FormControl>

      <FormControl label="Domain Name" errors={errors?.domain}>
        <Input
          value={values.domain}
          onChange={(e) => setFieldValue('domain', e.target.value)}
          placeholder="e.g. example.com"
          data-cy="docker-container-domain-input"
        />
      </FormControl>

      <FormControl label="MAC Address" errors={errors?.macAddress}>
        <Input
          value={values.macAddress}
          onChange={(e) => setFieldValue('macAddress', e.target.value)}
          placeholder="e.g. 12-34-56-78-9a-bc"
          data-cy="docker-container-mac-address-input"
        />
      </FormControl>

      <FormControl label="IPv4 Address" errors={errors?.ipv4Address}>
        <Input
          value={values.ipv4Address}
          onChange={(e) => setFieldValue('ipv4Address', e.target.value)}
          placeholder="e.g. 172.20.0.7"
          data-cy="docker-container-ipv4-address-input"
        />
      </FormControl>

      <FormControl label="IPv6 Address" errors={errors?.ipv6Address}>
        <Input
          value={values.ipv6Address}
          onChange={(e) => setFieldValue('ipv6Address', e.target.value)}
          placeholder="e.g. a:b:c:d::1234"
          data-cy="docker-container-ipv6-address-input"
        />
      </FormControl>

      <FormControl label="Primary DNS Server" errors={errors?.primaryDns}>
        <Input
          value={values.primaryDns}
          onChange={(e) => setFieldValue('primaryDns', e.target.value)}
          placeholder="e.g. 1.1.1.1, 2606:4700:4700::1111"
          data-cy="docker-container-primary-dns-input"
        />
      </FormControl>

      <FormControl label="Secondary DNS Server" errors={errors?.secondaryDns}>
        <Input
          value={values.secondaryDns}
          onChange={(e) => setFieldValue('secondaryDns', e.target.value)}
          placeholder="e.g. 1.0.0.1, 2606:4700:4700::1001"
          data-cy="docker-container-secondary-dns-input"
        />
      </FormControl>

      <InputList
        label="Hosts file entries"
        value={values.hostsFileEntries}
        onChange={(hostsFileEntries) =>
          setFieldValue('hostsFileEntries', hostsFileEntries)
        }
        errors={errors?.hostsFileEntries}
        item={HostsFileEntryItem}
        itemBuilder={() => ''}
        data-cy="docker-container-hosts-file-entries"
      />
    </div>
  );
}

function HostsFileEntryItem({
  item,
  onChange,
  disabled,
  error,
  readOnly,
  index,
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
          data-cy={`docker-container-hosts-file-entry_${index}`}
        />
      </InputGroup>

      {error && <FormError>{error}</FormError>}
    </div>
  );
}
