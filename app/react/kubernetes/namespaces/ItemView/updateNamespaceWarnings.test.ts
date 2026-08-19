import { Registry } from '@/react/portainer/registries/types/registry';

import { ResourceQuotaFormValues } from '../components/NamespaceForm/ResourceQuotaFormSection/types';
import { IngressControllerClassMap } from '../../cluster/ingressClass/types';

import {
  hasResourceQuotaBeenReduced,
  hasNamespaceAccessBeenRemoved,
  hasIngressClassesBeenRemoved,
} from './updateNamespaceWarnings';

function buildResourceQuota(
  overrides: Partial<ResourceQuotaFormValues> = {}
): ResourceQuotaFormValues {
  return {
    enabled: true,
    cpu: '1',
    memory: '256',
    ...overrides,
  };
}

function buildRegistry(
  id: number,
  namespaces: string[] = [],
  environmentId = 1
): Registry {
  return {
    Id: id,
    Type: 6,
    Name: `Registry ${id}`,
    URL: `registry${id}.example.com`,
    BaseURL: '',
    Authentication: false,
    Username: '',
    Password: '',
    RegistryAccesses: {
      [`${environmentId}`]: {
        UserAccessPolicies: null,
        TeamAccessPolicies: null,
        Namespaces: namespaces,
      },
    },
    Gitlab: { ProjectId: 0, InstanceURL: '', ProjectPath: '' },
    Quay: { OrganisationName: '', UseOrganisation: false },
    Ecr: { Region: '' },
    Github: { UseOrganisation: false, OrganisationName: '' },
  } as Registry;
}

function buildIngressClass(
  name: string,
  availability: boolean
): IngressControllerClassMap {
  return {
    Name: name,
    ClassName: name,
    Type: 'nginx',
    Availability: availability,
    New: false,
    Used: false,
  };
}

describe('hasResourceQuotaBeenReduced', () => {
  it('should return false when values are the same', () => {
    const quota = buildResourceQuota();
    expect(hasResourceQuotaBeenReduced(quota, quota)).toBe(false);
  });

  it('should return true when CPU is decreased', () => {
    const initial = buildResourceQuota({ cpu: '4' });
    const updated = buildResourceQuota({ cpu: '2' });
    expect(hasResourceQuotaBeenReduced(updated, initial)).toBe(true);
  });

  it('should return true when memory is decreased', () => {
    const initial = buildResourceQuota({ memory: '512' });
    const updated = buildResourceQuota({ memory: '256' });
    expect(hasResourceQuotaBeenReduced(updated, initial)).toBe(true);
  });

  it('should return false when all values are increased', () => {
    const initial = buildResourceQuota();
    const updated = buildResourceQuota({ cpu: '2', memory: '512' });
    expect(hasResourceQuotaBeenReduced(updated, initial)).toBe(false);
  });

  it('should treat empty/zero as unlimited (not a reduction)', () => {
    const initial = buildResourceQuota({ cpu: '' });
    const updated = buildResourceQuota({ cpu: '' });
    expect(hasResourceQuotaBeenReduced(updated, initial)).toBe(false);
  });

  it('should return true when going from unlimited to a set value', () => {
    const initial = buildResourceQuota({ cpu: '', memory: '' });
    const updated = buildResourceQuota({ cpu: '2' });
    expect(hasResourceQuotaBeenReduced(updated, initial)).toBe(true);
  });

  it('should return false when there is no initial quota', () => {
    const updated = buildResourceQuota();
    expect(hasResourceQuotaBeenReduced(updated, undefined)).toBe(false);
  });
});

describe('hasNamespaceAccessBeenRemoved', () => {
  it('should return true when a registry is removed entirely', () => {
    const initial = [buildRegistry(1, ['default'])];
    const updated: Registry[] = [];
    expect(hasNamespaceAccessBeenRemoved(updated, initial, 1, 'default')).toBe(
      true
    );
  });

  it('should return true when namespace is removed from registry accesses', () => {
    const initial = [buildRegistry(1, ['default'])];
    const updated = [buildRegistry(1, [])];
    expect(hasNamespaceAccessBeenRemoved(updated, initial, 1, 'default')).toBe(
      true
    );
  });

  it('should return false when registries and accesses are unchanged', () => {
    const registries = [buildRegistry(1, ['default'])];
    expect(
      hasNamespaceAccessBeenRemoved(registries, registries, 1, 'default')
    ).toBe(false);
  });

  it('should return false when namespace was not in old accesses', () => {
    const initial = [buildRegistry(1, ['other-ns'])];
    const updated: Registry[] = [];
    expect(hasNamespaceAccessBeenRemoved(updated, initial, 1, 'default')).toBe(
      false
    );
  });
});

describe('hasIngressClassesBeenRemoved', () => {
  it('should return false when availability is unchanged', () => {
    const classes = [buildIngressClass('nginx', true)];
    expect(hasIngressClassesBeenRemoved(classes, classes)).toBe(false);
  });

  it('should return true when availability is changed', () => {
    const initial = [buildIngressClass('nginx', true)];
    const updated = [buildIngressClass('nginx', false)];
    expect(hasIngressClassesBeenRemoved(updated, initial)).toBe(true);
  });

  it('should return true when class is removed from new list', () => {
    const initial = [buildIngressClass('nginx', true)];
    const updated: IngressControllerClassMap[] = [];
    expect(hasIngressClassesBeenRemoved(updated, initial)).toBe(true);
  });
});
