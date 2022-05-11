import { ResourceControlViewModel } from './models/ResourceControlViewModel';
import { ResourceControlOwnership, ResourceControlType } from './types';
import { parseAccessControlFormData } from './utils';

describe('parseAccessControlFormData', () => {
  [
    ResourceControlOwnership.ADMINISTRATORS,
    ResourceControlOwnership.RESTRICTED,
    ResourceControlOwnership.PUBLIC,
    ResourceControlOwnership.PRIVATE,
  ].forEach((ownership) => {
    test(`when resource control supplied, if user is not admin, will change ownership to rc ownership (${ownership})`, () => {
      const resourceControl = buildResourceControl(ownership);

      const actual = parseAccessControlFormData(false, resourceControl);
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

      const actual = parseAccessControlFormData(true, resourceControl);
      expect(actual.ownership).toBe(resourceControl.Ownership);
    });
  });

  test('when isAdmin and resource control not supplied, ownership should be set to Administrator', () => {
    const actual = parseAccessControlFormData(true);

    expect(actual.ownership).toBe(ResourceControlOwnership.ADMINISTRATORS);
  });

  test('when resource control supplied, if user is admin and resource ownership is private, will change ownership to restricted', () => {
    const resourceControl = buildResourceControl(
      ResourceControlOwnership.PRIVATE
    );

    const actual = parseAccessControlFormData(true, resourceControl);
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
