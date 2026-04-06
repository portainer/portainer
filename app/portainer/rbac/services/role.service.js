import { RoleViewModel, RoleTypes } from '../models/role';
import i18n from '@/i18n';

export function RoleService() {
  const rolesData = [
    new RoleViewModel(RoleTypes.ENDPOINT_ADMIN, i18n.t('roles.env_admin'), i18n.t('roles.env_admin_desc'), []),
    new RoleViewModel(RoleTypes.OPERATOR, i18n.t('roles.operator'), i18n.t('roles.operator_desc'), []),
    new RoleViewModel(RoleTypes.HELPDESK, i18n.t('roles.helpdesk'), i18n.t('roles.helpdesk_desc'), []),
    new RoleViewModel(RoleTypes.READ_ONLY, i18n.t('roles.read_only'), i18n.t('roles.read_only_desc'), []),
    new RoleViewModel(RoleTypes.STANDARD, i18n.t('roles.standard'), i18n.t('roles.standard_desc'), []),
  ];

  return {
    roles,
  };

  function roles() {
    return rolesData;
  }
}
