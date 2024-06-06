import { FormikErrors } from 'formik';
import _ from 'lodash';
import { useMemo } from 'react';

import { trimSHA, trimVersionTag } from 'Docker/filters/utils';
import DockerIcon from '@/assets/ico/vendor/docker.svg?c';
import { useImages } from '@/react/docker/proxy/queries/images/useImages';
import {
  imageContainsURL,
  getUniqueTagListFromImages,
} from '@/react/docker/images/utils';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';
import {
  Registry,
  RegistryId,
  RegistryTypes,
} from '@/react/portainer/registries/types/registry';
import { useRegistry } from '@/react/portainer/registries/queries/useRegistry';

import { Button } from '@@/buttons';
import { FormControl } from '@@/form-components/FormControl';
import { InputGroup } from '@@/form-components/InputGroup';
import { PortainerSelect } from '@@/form-components/PortainerSelect';
import { Input } from '@@/form-components/Input';

import { Values } from './types';
import { InputSearch } from './InputSearch';
import { getIsDockerHubRegistry } from './utils';

export function SimpleForm({
  autoComplete,
  values,
  errors,
  onChangeImage,
  setFieldValue,
}: {
  autoComplete?: boolean;
  values: Values;
  errors?: FormikErrors<Values>;
  onChangeImage?: (name: string) => void;
  setFieldValue: <T>(field: string, value: T) => void;
}) {
  const registryQuery = useRegistry(values.registryId);

  const registry = registryQuery.data;

  const registryUrl = getRegistryURL(registry) || 'docker.io';
  const isDockerHubRegistry = getIsDockerHubRegistry(registry);

  return (
    <>
      <FormControl
        label="Registry"
        inputId="registry-field"
        errors={errors?.registryId}
      >
        <RegistrySelector
          onChange={(value) => setFieldValue('registryId', value)}
          value={values.registryId}
          inputId="registry-field"
        />
      </FormControl>

      <FormControl label="Image" inputId="image-field" errors={errors?.image}>
        <InputGroup>
          <InputGroup.Addon>{registryUrl}</InputGroup.Addon>

          <ImageField
            onChange={(value) => {
              setFieldValue('image', value);
              onChangeImage?.(value);
            }}
            value={values.image}
            registry={registry}
            autoComplete={autoComplete}
            inputId="image-field"
          />

          {isDockerHubRegistry && (
            <InputGroup.ButtonWrapper>
              <Button
                as="a"
                title="Search image on Docker Hub"
                color="default"
                props={{
                  href: `https://hub.docker.com/search?type=image&q=${trimVersionTag(
                    trimSHA(values.image)
                  )}`,
                  target: '_blank',
                  rel: 'noreferrer',
                }}
                icon={DockerIcon}
                data-cy="component-dockerHubSearchButton"
              >
                Search
              </Button>
            </InputGroup.ButtonWrapper>
          )}
        </InputGroup>
      </FormControl>
    </>
  );
}

function getImagesForRegistry(
  images: string[],
  registries: Array<Registry>,
  registry?: Registry
) {
  if (isKnownRegistry(registry)) {
    const url = getRegistryURL(registry);
    const registryImages = images.filter((image) => image.includes(url));
    return registryImages.map((image) =>
      image.replace(new RegExp(`${url}/?`), '')
    );
  }

  const knownRegistries = registries.filter((reg) => isKnownRegistry(reg));
  const registryImages = knownRegistries.flatMap((registry) =>
    images.filter((image) => image.includes(registry.URL))
  );
  return _.difference(images, registryImages).filter(
    (image) => !imageContainsURL(image)
  );
}

function RegistrySelector({
  value,
  onChange,
  inputId,
}: {
  value: RegistryId | undefined;
  onChange: (value: RegistryId | undefined) => void;
  inputId?: string;
}) {
  const environmentId = useEnvironmentId();

  const registriesQuery = useEnvironmentRegistries(environmentId, {
    select: (registries) =>
      registries
        .sort((a, b) => a.Name.localeCompare(b.Name))
        .map((registry) => ({
          label: registry.Name,
          value: registry.Id,
        })),
    onSuccess: (options) => {
      if (options && options.length) {
        const idx = options.findIndex((v) => v.value === value);
        if (idx === -1) {
          onChange(options[0].value);
        }
      }
    },
  });

  return (
    <PortainerSelect
      inputId={inputId}
      options={registriesQuery.data || []}
      value={value}
      onChange={onChange}
      data-cy="component-registrySelect"
    />
  );
}

function ImageField({
  value,
  onChange,
  registry,
  autoComplete,
  inputId,
}: {
  value: string;
  onChange: (value: string) => void;
  registry?: Registry;
  autoComplete?: boolean;
  inputId: string;
}) {
  return autoComplete ? (
    <ImageFieldAutoComplete
      value={value}
      onChange={onChange}
      registry={registry}
      inputId={inputId}
    />
  ) : (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      id={inputId}
      data-cy="image-field-simple-input"
    />
  );
}

function ImageFieldAutoComplete({
  value,
  onChange,
  registry,
  inputId,
}: {
  value: string;
  onChange: (value: string) => void;
  registry?: Registry;
  inputId: string;
}) {
  const environmentId = useEnvironmentId();

  const registriesQuery = useEnvironmentRegistries(environmentId);

  const imagesQuery = useImages(environmentId, {
    select: (images) => getUniqueTagListFromImages(images),
  });

  const imageOptions = useMemo(() => {
    const images = getImagesForRegistry(
      imagesQuery.data || [],
      registriesQuery.data || [],
      registry
    );
    return images.map((image) => ({
      label: image,
      value: image,
    }));
  }, [registry, imagesQuery.data, registriesQuery.data]);

  return (
    <InputSearch
      value={value}
      onChange={(value) => onChange(value)}
      data-cy="component-imageInput"
      placeholder="e.g. my-image:my-tag"
      options={imageOptions}
      inputId={inputId}
    />
  );
}

function isKnownRegistry(registry?: Registry) {
  return registry && registry.Type !== RegistryTypes.ANONYMOUS && registry.URL;
}

function getRegistryURL(registry?: Registry) {
  if (!registry) {
    return '';
  }

  if (
    registry.Type !== RegistryTypes.GITLAB &&
    registry.Type !== RegistryTypes.GITHUB
  ) {
    return registry.URL;
  }

  if (registry.Type === RegistryTypes.GITLAB) {
    return `${registry.URL}/${registry.Gitlab?.ProjectPath}`;
  }

  if (registry.Type === RegistryTypes.GITHUB) {
    const namespace = registry.Github?.UseOrganisation
      ? registry.Github?.OrganisationName
      : registry.Username;
    return `${registry.URL}/${namespace}`;
  }

  return '';
}
