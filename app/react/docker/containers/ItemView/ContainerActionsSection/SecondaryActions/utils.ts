import { EnvironmentSecuritySettings } from '@/react/portainer/environments/types';

/**
 * Checks if security settings restrict regular users from container operations
 */
export function isRegularUserRestricted(
  securitySettings: EnvironmentSecuritySettings
): boolean {
  return (
    !securitySettings.allowContainerCapabilitiesForRegularUsers ||
    !securitySettings.allowBindMountsForRegularUsers ||
    !securitySettings.allowDeviceMappingForRegularUsers ||
    !securitySettings.allowSysctlSettingForRegularUsers ||
    !securitySettings.allowSecurityOptForRegularUsers ||
    !securitySettings.allowHostNamespaceForRegularUsers ||
    !securitySettings.allowPrivilegedModeForRegularUsers
  );
}
