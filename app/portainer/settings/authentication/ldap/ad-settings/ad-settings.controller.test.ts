import { describe, it, expect } from 'vitest';

import AdSettingsController from './ad-settings.controller';

function createController() {
  return new AdSettingsController(null, null);
}

describe('parseDomainName', () => {
  it('derives the domain suffix from a UPN-format service account', () => {
    const ctrl = createController();

    ctrl.parseDomainName('reader@portainer.io');

    expect(ctrl.domainSuffix).toBe('dc=portainer,dc=io');
  });

  it('derives the domain suffix from a DN-format service account', () => {
    const ctrl = createController();

    ctrl.parseDomainName('cn=reader,dc=portainer,dc=io');

    expect(ctrl.domainSuffix).toBe('dc=portainer,dc=io');
  });

  it('trims whitespace around DN components', () => {
    const ctrl = createController();

    ctrl.parseDomainName('cn=reader, dc=portainer, dc=io');

    expect(ctrl.domainSuffix).toBe('dc=portainer,dc=io');
  });

  it('clears the domain suffix when a DN has no domain components', () => {
    const ctrl = createController();

    ctrl.parseDomainName('cn=reader');

    expect(ctrl.domainSuffix).toBe('');
  });
});
