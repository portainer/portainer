import { Input } from '@@/form-components/Input';
import { InputListActionButtons } from '@@/form-components/InputList/ActionButtons';
import { FormControl } from '@@/form-components/FormControl';

import { LDAPGroupSearchSettings } from '../../types';

interface AdminGroupSearchConfigItemProps {
  value: LDAPGroupSearchSettings;
  index: number;
  count: number;
  isLimited: boolean;
  onChange: (value: LDAPGroupSearchSettings) => void;
  onRemove: () => void;
}

export function AdminGroupSearchConfigItem({
  value,
  index,
  count,
  isLimited,
  onChange,
  onRemove,
}: AdminGroupSearchConfigItemProps) {
  return (
    <>
      <div className="flex gap-5">
        <FormControl
          size="large"
          className="w-1/2 flex-1"
          label="Group Base DN"
          tooltip="The distinguished name of the element from which the LDAP server will search for groups."
          inputId={`ldap_admin_group_basedn_${index}`}
        >
          <Input
            id={`ldap_admin_group_basedn_${index}`}
            data-cy="ldap-admin-group-basedn"
            value={value.GroupBaseDN}
            onChange={(e) =>
              onChange({ ...value, GroupBaseDN: e.target.value })
            }
            placeholder="dc=ldap,dc=domain,dc=tld"
            disabled={isLimited}
            className={isLimited ? 'limited-be border-0' : undefined}
          />
        </FormControl>

        <FormControl
          size="large"
          className="w-1/2 flex-1"
          label="Group Membership Attribute"
          tooltip="LDAP attribute which denotes the group membership."
          inputId={`ldap_admin_group_att_${index}`}
        >
          <Input
            id={`ldap_admin_group_att_${index}`}
            data-cy="ldap-admin-group-att"
            value={value.GroupAttribute}
            onChange={(e) =>
              onChange({ ...value, GroupAttribute: e.target.value })
            }
            placeholder="member"
            disabled={isLimited}
            className={isLimited ? 'limited-be border-0' : undefined}
          />
        </FormControl>
      </div>

      <div className="flex">
        <FormControl
          size="small"
          className="w-full flex-1"
          label="Group Filter"
          tooltip="The LDAP search filter used to select group elements, optional."
          inputId={`ldap_admin_group_filter_${index}`}
        >
          <div className="vertical-center">
            <Input
              id={`ldap_admin_group_filter_${index}`}
              data-cy="ldap-admin-group-filter"
              value={value.GroupFilter}
              onChange={(e) =>
                onChange({ ...value, GroupFilter: e.target.value })
              }
              placeholder="(objectClass=groupOfNames)"
              className={isLimited ? 'limited-be border-0' : undefined}
              disabled={isLimited}
            />
            <InputListActionButtons
              index={index}
              count={count}
              showDelete={index > 0}
              onDelete={onRemove}
              disabled={isLimited}
              data-cy="admin-group-search"
            />
          </div>
        </FormControl>
      </div>
    </>
  );
}
