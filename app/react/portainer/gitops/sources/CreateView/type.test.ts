import {
  AccessControlFormData,
  ResourceControlOwnership,
} from '@/react/portainer/access-control/types';

import { formValuesToCreatePayload, gitFormValuesToTestPayload } from './type';

const baseGit = {
  url: 'https://github.com/org/repo.git',
  tlsSkipVerify: false,
  polling: { enabled: false, interval: '' },
  connectionOk: false,
};

const baseUAC: AccessControlFormData = {
  authorizedTeams: [],
  authorizedUsers: [],
  ownership: ResourceControlOwnership.ADMINISTRATORS,
};

describe('formValuesToCreatePayload', () => {
  it('populates authentication when authEnabled with username and password', () => {
    const payload = formValuesToCreatePayload({
      ...baseUAC,
      name: 'my-source',
      type: 'git',
      git: {
        ...baseGit,
        authentication: {
          authEnabled: true,
          username: 'alice',
          password: 'secret',
        },
      },
    });

    expect(payload.git.authentication).toEqual({
      username: 'alice',
      password: 'secret',
    });
  });

  it('omits authentication when authEnabled is false', () => {
    const payload = formValuesToCreatePayload({
      ...baseUAC,
      name: 'my-source',
      type: 'git',
      git: {
        ...baseGit,
        authentication: { authEnabled: false },
      },
    });

    expect(payload.git.authentication).toBeUndefined();
  });

  it('omits authentication when authEnabled but username is missing', () => {
    const payload = formValuesToCreatePayload({
      ...baseUAC,
      name: 'my-source',
      type: 'git',
      git: {
        ...baseGit,
        authentication: {
          authEnabled: true,
          password: 'secret',
        },
      },
    });

    expect(payload.git.authentication).toBeUndefined();
  });

  it('omits authentication when authEnabled but password is missing', () => {
    const payload = formValuesToCreatePayload({
      ...baseUAC,
      name: 'my-source',
      type: 'git',
      git: {
        ...baseGit,
        authentication: {
          authEnabled: true,
          username: 'alice',
        },
      },
    });

    expect(payload.git.authentication).toBeUndefined();
  });

  it('sends the interval when polling is enabled', () => {
    const payload = formValuesToCreatePayload({
      ...baseUAC,
      name: 'my-source',
      type: 'git',
      git: {
        ...baseGit,
        authentication: { authEnabled: false },
        polling: { enabled: true, interval: '5m' },
      },
    });

    expect(payload.git.interval).toBe('5m');
  });

  it('sends an empty interval when polling is disabled', () => {
    const payload = formValuesToCreatePayload({
      ...baseUAC,
      name: 'my-source',
      type: 'git',
      git: {
        ...baseGit,
        authentication: { authEnabled: false },
        polling: { enabled: false, interval: '5m' },
      },
    });

    expect(payload.git.interval).toBe('');
  });

  it('does not include connectionOk in the create payload', () => {
    const payload = formValuesToCreatePayload({
      ...baseUAC,
      name: 'my-source',
      type: 'git',
      git: {
        ...baseGit,
        connectionOk: true,
        authentication: { authEnabled: false },
      },
    });

    expect(payload.git).not.toHaveProperty('connectionOk');
  });
});

describe('gitFormValuesToTestPayload', () => {
  it('populates authentication when authEnabled with username and password', () => {
    const payload = gitFormValuesToTestPayload({
      ...baseGit,
      authentication: {
        authEnabled: true,
        username: 'alice',
        password: 'secret',
      },
    });

    expect(payload.authentication).toEqual({
      username: 'alice',
      password: 'secret',
    });
  });

  it('omits authentication when authEnabled is false', () => {
    const payload = gitFormValuesToTestPayload({
      ...baseGit,
      authentication: { authEnabled: false },
    });

    expect(payload.authentication).toBeUndefined();
  });
});
