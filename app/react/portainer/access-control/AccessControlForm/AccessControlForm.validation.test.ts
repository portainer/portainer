import { ResourceControlOwnership } from '../types';

import { validationSchema } from './AccessControlForm.validation';

test('when ownership not restricted, should be valid', async () => {
  const schema = validationSchema(true);
  [
    ResourceControlOwnership.ADMINISTRATORS,
    ResourceControlOwnership.PRIVATE,
    ResourceControlOwnership.PUBLIC,
  ].forEach(async (ownership) => {
    const object = { ownership };

    await expect(
      schema.validate(object, { strict: true })
    ).resolves.toStrictEqual(object);
  });
});

test('when ownership is restricted and no teams or users, should be invalid', async () => {
  [true, false].forEach(async (isAdmin) => {
    const schema = validationSchema(isAdmin);

    await expect(
      schema.validate(
        {
          ownership: ResourceControlOwnership.RESTRICTED,
          authorizedTeams: [],
          authorizedUsers: [],
        },
        { strict: true }
      )
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});

test('when ownership is restricted, and the user is admin should have either teams or users', async () => {
  const schema = validationSchema(true);
  const teams = {
    ownership: ResourceControlOwnership.RESTRICTED,
    authorizedTeams: [1],
    authorizedUsers: [],
  };

  await expect(schema.validate(teams, { strict: true })).resolves.toStrictEqual(
    teams
  );

  const users = {
    ownership: ResourceControlOwnership.RESTRICTED,
    authorizedTeams: [],
    authorizedUsers: [1],
  };

  await expect(schema.validate(users, { strict: true })).resolves.toStrictEqual(
    users
  );

  const both = {
    ownership: ResourceControlOwnership.RESTRICTED,
    authorizedTeams: [1],
    authorizedUsers: [2],
  };

  await expect(schema.validate(both, { strict: true })).resolves.toStrictEqual(
    both
  );
});

test('when  ownership is restricted, user is not admin with teams, should be valid', async () => {
  const schema = validationSchema(false);

  const object = {
    ownership: ResourceControlOwnership.RESTRICTED,
    authorizedTeams: [1],
    authorizedUsers: [],
  };

  await expect(
    schema.validate(object, { strict: true })
  ).resolves.toStrictEqual(object);
});
