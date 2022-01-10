import { ResourceControlOwnership as RCO } from '@/portainer/models/resourceControl/resourceControlOwnership';
import {
  ResourceControlType,
  ResourceControlViewModel,
} from '@/portainer/models/resourceControl/resourceControl';

import { parseFromResourceControl } from './model';

test('when resource control supplied, if user is not admin, will change ownership to rc ownership', () => {
  [RCO.ADMINISTRATORS, RCO.RESTRICTED, RCO.PUBLIC, RCO.PRIVATE].forEach(
    (ownership) => {
      const resourceControl = buildResourceControl(ownership);

      const actual = parseFromResourceControl(false, resourceControl.Ownership);
      expect(actual.ownership).toBe(resourceControl.Ownership);
    }
  );
});

test('when resource control supplied and user is admin, if resource ownership is not private , will change ownership to rc ownership', () => {
  [RCO.ADMINISTRATORS, RCO.RESTRICTED, RCO.PUBLIC].forEach((ownership) => {
    const resourceControl = buildResourceControl(ownership);

    const actual = parseFromResourceControl(true, resourceControl.Ownership);
    expect(actual.ownership).toBe(resourceControl.Ownership);
  });
});

test('when resource control supplied, if ownership is public, will disabled access control', () => {
  const resourceControl = buildResourceControl(RCO.PUBLIC);

  const actual = parseFromResourceControl(false, resourceControl.Ownership);

  expect(actual.accessControlEnabled).toBe(false);
});

test('when isAdmin and resource control not supplied, ownership should be set to Administrator', () => {
  const actual = parseFromResourceControl(true);

  expect(actual.ownership).toBe(RCO.ADMINISTRATORS);
});

test('when resource control supplied, if user is admin and resource ownership is private, will change ownership to restricted', () => {
  const resourceControl = buildResourceControl(RCO.PRIVATE);

  const actual = parseFromResourceControl(true, resourceControl.Ownership);
  expect(actual.ownership).toBe(RCO.RESTRICTED);
});

function buildResourceControl(ownership: RCO): ResourceControlViewModel {
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
