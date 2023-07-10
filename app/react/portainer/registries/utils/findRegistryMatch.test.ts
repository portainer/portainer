import { Registry, RegistryId, RegistryTypes } from '../types/registry';

import { findBestMatchRegistry } from './findRegistryMatch';

function buildTestRegistry(
  id: RegistryId,
  type: RegistryTypes,
  name: string,
  url: string
): Registry {
  return {
    Id: id,
    Type: type,
    URL: url,
    Name: name,
    Username: '',
    Authentication: false,
    Password: '',
    BaseURL: '',
    Checked: false,
    Ecr: { Region: '' },
    Github: { OrganisationName: '', UseOrganisation: false },
    Quay: { OrganisationName: '', UseOrganisation: false },
    Gitlab: { InstanceURL: '', ProjectId: 0, ProjectPath: '' },
    RegistryAccesses: {},
  };
}

describe('findBestMatchRegistry', () => {
  const registries: Array<Registry> = [
    buildTestRegistry(
      1,
      RegistryTypes.DOCKERHUB,
      'DockerHub',
      'hub.docker.com'
    ),
    buildTestRegistry(
      2,
      RegistryTypes.DOCKERHUB,
      'DockerHub2',
      'https://registry2.com'
    ),
    buildTestRegistry(
      3,
      RegistryTypes.GITHUB,
      'GitHub',
      'https://registry3.com'
    ),
  ];

  it('should return the registry with the given ID', () => {
    const registryId = 2;
    const result = findBestMatchRegistry('repository', registries, registryId);
    expect(result).toEqual(registries[1]);
  });

  it('should return the DockerHub registry with matching username and URL', () => {
    const repository = 'user1/repository';
    const result = findBestMatchRegistry(repository, registries);
    expect(result).toEqual(registries[0]);
  });

  it('should return the registry with a matching URL', () => {
    const repository = 'https://registry2.com/repository';
    const result = findBestMatchRegistry(repository, registries);
    expect(result).toEqual(registries[1]);
  });

  it('should return the default DockerHub registry if no matches are found', () => {
    const repository = 'repository';
    const result = findBestMatchRegistry(repository, registries);
    expect(result).toEqual(registries[0]);
  });

  it('when using something:latest, shouldn\'t choose "tes" docker', () => {
    const repository = 'something:latest';
    const result = findBestMatchRegistry(repository, [
      ...registries,
      buildTestRegistry(4, RegistryTypes.CUSTOM, 'Test', 'tes'),
    ]);
    expect(result).toEqual(registries[0]);
  });
});
