import { ResourceControlOwnership } from '@/react/portainer/access-control/types';

import { FormValues } from './type';
import { validateGitConnection, validationSchema } from './validation';

const baseAuth = {
  authEnabled: false,
};

const validGitValues = {
  url: 'https://github.com/org/repo.git',
  tlsSkipVerify: false,
  connectionOk: true,
  authentication: baseAuth,
};

describe('validateGitConnection (pick schema — no connectionOk)', () => {
  it('passes when url is valid and auth disabled', async () => {
    const schema = validateGitConnection();
    await expect(
      schema.isValid({
        url: 'https://github.com/org/repo.git',
        tlsSkipVerify: false,
        authentication: baseAuth,
      })
    ).resolves.toBe(true);
  });

  it('does not require connectionOk', async () => {
    const schema = validateGitConnection();
    await expect(
      schema.isValid({
        url: 'https://github.com/org/repo.git',
        authentication: baseAuth,
      })
    ).resolves.toBe(true);
  });

  it('rejects empty URL', async () => {
    const schema = validateGitConnection();
    await expect(
      schema.isValid({
        url: '',
        authentication: baseAuth,
      })
    ).resolves.toBe(false);
  });

  it('rejects localhost URL', async () => {
    const schema = validateGitConnection();
    await expect(
      schema.isValid({
        url: 'http://localhost/repo.git',
        authentication: baseAuth,
      })
    ).resolves.toBe(false);
  });

  it('accepts a normal https URL', async () => {
    const schema = validateGitConnection();
    await expect(
      schema.isValid({
        url: 'https://gitlab.example.com/org/repo.git',
        authentication: baseAuth,
      })
    ).resolves.toBe(true);
  });
});

describe('validationSchema git.authentication', () => {
  it('requires username and password when authEnabled is true', async () => {
    const schema = validationSchema();
    const result = await schema.isValid({
      name: 'src',
      type: 'git',
      git: {
        ...validGitValues,
        authentication: { ...baseAuth, authEnabled: true },
      },
      authorizedTeams: [],
      authorizedUsers: [],
      ownership: ResourceControlOwnership.ADMINISTRATORS,
    } satisfies FormValues);
    expect(result).toBe(false);
  });

  it('passes when authEnabled is false and no credentials provided', async () => {
    const schema = validationSchema();
    const result = await schema.isValid({
      name: 'src',
      type: 'git',
      git: validGitValues,
      authorizedTeams: [],
      authorizedUsers: [],
      ownership: ResourceControlOwnership.ADMINISTRATORS,
    } satisfies FormValues);
    expect(result).toBe(true);
  });

  it('passes when authEnabled is true and credentials are provided', async () => {
    const schema = validationSchema();
    const result = await schema.isValid({
      name: 'src',
      type: 'git',
      git: {
        ...validGitValues,
        authentication: {
          ...baseAuth,
          authEnabled: true,
          username: 'alice',
          password: 'secret',
        },
      },
      authorizedTeams: [],
      authorizedUsers: [],
      ownership: ResourceControlOwnership.ADMINISTRATORS,
    } satisfies FormValues);
    expect(result).toBe(true);
  });
});

describe('validationSchema full git (requires connectionOk)', () => {
  it('fails when connectionOk is false', async () => {
    const schema = validationSchema();
    const result = await schema.isValid({
      name: 'src',
      type: 'git',
      git: {
        ...validGitValues,
        connectionOk: false,
      },
      authorizedTeams: [],
      authorizedUsers: [],
      ownership: ResourceControlOwnership.ADMINISTRATORS,
    } satisfies FormValues);
    expect(result).toBe(false);
  });

  it('passes when connectionOk is true', async () => {
    const schema = validationSchema();
    const result = await schema.isValid({
      name: 'src',
      type: 'git',
      git: validGitValues,
      authorizedTeams: [],
      authorizedUsers: [],
      ownership: ResourceControlOwnership.ADMINISTRATORS,
    } satisfies FormValues);
    expect(result).toBe(true);
  });

  it('requires name', async () => {
    const schema = validationSchema();
    const result = await schema.isValid({
      name: '',
      type: 'git',
      git: validGitValues,
      authorizedTeams: [],
      authorizedUsers: [],
      ownership: ResourceControlOwnership.ADMINISTRATORS,
    } satisfies FormValues);
    expect(result).toBe(false);
  });
});
