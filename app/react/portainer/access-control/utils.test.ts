import { ResourceControlViewModel } from './models/ResourceControlViewModel';
import { ResourceControlOwnership, ResourceControlType } from './types';
import { parseAccessControlFormData } from './utils';

describe('parseAccessControlFormData', () => {
  test('when ownership is private and resource is supplied, authorizedUsers should be UserAccess', () => {
    const resourceControl = buildResourceControl(
      ResourceControlOwnership.PRIVATE
    );
    resourceControl.UserAccesses = [{ UserId: 1, AccessLevel: 1 }];

    const actual = parseAccessControlFormData(false, 1, resourceControl);
    expect(actual.authorizedUsers).toContain(1);
    expect(actual.authorizedUsers).toHaveLength(1);
  });

  test('when not admin and no resource control, ownership should be set to private and authorizedUsers is only currentUserId', () => {
    const actual = parseAccessControlFormData(false, 1);

    expect(actual.ownership).toBe(ResourceControlOwnership.PRIVATE);
    expect(actual.authorizedUsers).toContain(1);
    expect(actual.authorizedUsers).toHaveLength(1);
  });

  [
    ResourceControlOwnership.ADMINISTRATORS,
    ResourceControlOwnership.RESTRICTED,
    ResourceControlOwnership.PUBLIC,
    ResourceControlOwnership.PRIVATE,
  ].forEach((ownership) => {
    test(`when resource control supplied, if user is not admin, will change ownership to rc ownership (${ownership})`, () => {
      const resourceControl = buildResourceControl(ownership);

      const actual = parseAccessControlFormData(false, 0, resourceControl);
      expect(actual.ownership).toBe(resourceControl.Ownership);
    });
  });

  [
    ResourceControlOwnership.ADMINISTRATORS,
    ResourceControlOwnership.RESTRICTED,
    ResourceControlOwnership.PUBLIC,
  ].forEach((ownership) => {
    test(`when resource control supplied and user is admin, if resource ownership is ${ownership} , will change ownership to rc ownership`, () => {
      const resourceControl = buildResourceControl(ownership);

      const actual = parseAccessControlFormData(true, 0, resourceControl);
      expect(actual.ownership).toBe(resourceControl.Ownership);
    });
  });

  test('when isAdmin and resource control not supplied, ownership should be set to Administrator', () => {
    const actual = parseAccessControlFormData(true, 0);

    expect(actual.ownership).toBe(ResourceControlOwnership.ADMINISTRATORS);
  });

  test('when resource control supplied, if user is admin and resource ownership is private, will change ownership to restricted', () => {
    const resourceControl = buildResourceControl(
      ResourceControlOwnership.PRIVATE
    );

    const actual = parseAccessControlFormData(true, 0, resourceControl);
    expect(actual.ownership).toBe(ResourceControlOwnership.RESTRICTED);
  });

  function buildResourceControl(
    ownership: ResourceControlOwnership
  ): ResourceControlViewModel {
    return {
      UserAccesses: [],
      TeamAccesses: [],
      Ownership: ownership,
      Id: 1,
      Public: false,
      ResourceId: 1,
      System: false,
      Type: ResourceControlType.Config,
    };
  }
});
