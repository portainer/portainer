import { RoleViewModel, RoleTypes } from '../models/role';

export function RoleService() {
  const rolesData = [
    new RoleViewModel(RoleTypes.ENDPOINT_ADMIN, 'Environment administrator', 'Full control of all resources in an environment', []),
    new RoleViewModel(RoleTypes.OPERATOR, 'Operator', 'Operational Control of all existing resources in an environment', []),
    new RoleViewModel(RoleTypes.HELPDESK, 'Helpdesk', 'Read-only access of all resources in an environment', []),
    new RoleViewModel(RoleTypes.READ_ONLY, 'Read-only user', 'Read-only access of assigned resources in an environment', []),
    new RoleViewModel(RoleTypes.STANDARD, 'Standard user', 'Full control of assigned resources in an environment', []),
  ];

  return {
    roles,
  };

  function roles() {
    return rolesData;
  }
}
