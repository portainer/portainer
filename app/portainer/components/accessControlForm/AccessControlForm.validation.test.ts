import { ResourceControlOwnership } from '@/portainer/models/resourceControl/resourceControlOwnership';

import { validationSchema } from './AccessControlForm.validation';

test('when access control is disabled, should be valid', async () => {
  const schema = validationSchema(true);
  const object = { accessControlEnabled: false };

  await expect(
    schema.validate(object, { strict: true })
  ).resolves.toStrictEqual(object);
});

test('when only access control is enabled, should be invalid', async () => {
  const schema = validationSchema(true);

  await expect(
    schema.validate({ accessControlEnabled: true }, { strict: true })
  ).rejects.toThrowErrorMatchingSnapshot();
});

test('when access control is enabled and ownership not restricted, should be valid', async () => {
  const schema = validationSchema(true);
  [
    ResourceControlOwnership.ADMINISTRATORS,
    ResourceControlOwnership.PRIVATE,
    ResourceControlOwnership.PUBLIC,
  ].forEach(async (ownership) => {
    const object = { accessControlEnabled: false, ownership };

    await expect(
      schema.validate(object, { strict: true })
    ).resolves.toStrictEqual(object);
  });
});

test('when access control is enabled, ownership is restricted and no teams or users, should be invalid', async () => {
  [true, false].forEach(async (isAdmin) => {
    const schema = validationSchema(isAdmin);

    await expect(
      schema.validate(
        {
          accessControlEnabled: true,
          ownership: ResourceControlOwnership.RESTRICTED,
          authorizedTeams: [],
          authorizedUsers: [],
        },
        { strict: true }
      )
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});

test('when access control is enabled, ownership is restricted, user is admin should have either teams or users', async () => {
  const schema = validationSchema(true);
  const teams = {
    accessControlEnabled: true,
    ownership: ResourceControlOwnership.RESTRICTED,
    authorizedTeams: [1],
    authorizedUsers: [],
  };

  await expect(schema.validate(teams, { strict: true })).resolves.toStrictEqual(
    teams
  );

  const users = {
    accessControlEnabled: true,
    ownership: ResourceControlOwnership.RESTRICTED,
    authorizedTeams: [],
    authorizedUsers: [1],
  };

  await expect(schema.validate(users, { strict: true })).resolves.toStrictEqual(
    users
  );

  const both = {
    accessControlEnabled: true,
    ownership: ResourceControlOwnership.RESTRICTED,
    authorizedTeams: [1],
    authorizedUsers: [2],
  };

  await expect(schema.validate(both, { strict: true })).resolves.toStrictEqual(
    both
  );
});

test('when access control is enabled, ownership is restricted, user is admin with teams and users, should be valid', async () => {
  const schema = validationSchema(false);

  const object = {
    accessControlEnabled: true,
    ownership: ResourceControlOwnership.RESTRICTED,
    authorizedTeams: [1],
    authorizedUsers: [1],
  };

  await expect(
    schema.validate(object, { strict: true })
  ).resolves.toStrictEqual(object);
});

test('when access control is enabled, ownership is restricted, user is not admin with teams, should be valid', async () => {
  const schema = validationSchema(false);

  const object = {
    accessControlEnabled: true,
    ownership: ResourceControlOwnership.RESTRICTED,
    authorizedTeams: [1],
  };

  await expect(
    schema.validate(object, { strict: true })
  ).resolves.toStrictEqual(object);
});
