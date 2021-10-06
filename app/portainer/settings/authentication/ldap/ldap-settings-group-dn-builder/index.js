import controller from './ldap-settings-group-dn-builder.controller';

export const ldapSettingsGroupDnBuilder = {
  templateUrl: './ldap-settings-group-dn-builder.html',
  controller,
  bindings: {
    // ngModel: string (dc=,cn=,)
    ngModel: '<',
    // onChange(string) => void
    onChange: '<',
    // suffix: string (dc=,dc=,)
    suffix: '@',
    // index: int >= 0
    index: '<',
    onRemoveClick: '<',
    limitedFeatureId: '<',
  },
};
