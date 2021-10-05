import controller from './ldap-settings-dn-builder.controller';

export const ldapSettingsDnBuilder = {
  templateUrl: './ldap-settings-dn-builder.html',
  controller,
  bindings: {
    // ngModel: string (dc=,cn=,)
    ngModel: '<',
    // onChange(string) => void
    onChange: '<',
    // suffix: string (dc=,dc=,)
    suffix: '@',
    label: '@',
    limitedFeatureId: '<',
  },
};
