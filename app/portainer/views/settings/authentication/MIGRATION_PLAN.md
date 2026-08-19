# Migration Plan: Authentication Settings

**Linear Issue**: [BE-6604](https://linear.app/portainer/issue/BE-6604/migrate-portainersettingsauthentication)
**Project**: Migrate portainer/settings views to react
**Estimate**: 5 Points
**Status**: Draft → Planning
**Strategy**: See `.claude/skills/angular-react-migration-strategy/SKILL.md`
**Original Component Path**: `package/[ce|ee]/app/portainer/views/settings/authentication/`
**Target Migration Path**: `app/react/portainer/settings/AuthenticationView/`

## Current Structure Visualization

```
PageHeader ✅ React component
Widget ✅ React component
  Form
    SessionLifetimeSection
      Select (dropdown) - needs wrapper
      WarningMessage ✅ React component (Icon + text)

    AuthenticationMethodSection
      BoxSelector ✅ React component

      InternalAuth ✅ React component (already exists!)
        PasswordLengthSlider ✅
        SaveAuthSettingsButton ✅

      LdapSettings (Angular - needs migration)
        AutoUserProvisionToggle (Angular - needs component)
        BoxSelector ✅ React component
        LdapSettingsCustom (Angular - needs migration)
          Multiple input fields, TLS config, connectivity check
          LdapSettingsDnBuilder (Angular - needs component)
          LdapSettingsGroupDnBuilder (Angular - needs component)
          LdapSettingsSecurity (Angular - needs component)
          LdapSettingsTestLogin (Angular - needs component)
        LdapSettingsOpenLdap (Angular - needs migration)
          Similar structure to Custom
        [EE] AdminGroupsMultiSelect (needs component)

      AdSettings (Angular - needs migration)
        Similar to LdapSettings with AD-specific fields
        [EE] BindTypeSelector (kerberos vs simple)
        [EE] KerberosConfig (needs component)

      OAuthSettings (Angular - needs migration)
        SwitchField ✅ React component
        TeamSelector (Angular - needs component)
        ClaimMappingsTable (Angular - needs component)
        [EE] AdminAutoPopulate (needs component)
```

## EE vs CE Differences

**EE-specific features:**

- LDAP: `selected-admin-groups` binding (line 50, 62 in EE template)
- LDAP: Admin auto-populate with group selection
- AD: Kerberos bind type (simple vs kerberos)
- AD: Kerberos configuration fields (Realm, Username, Password, Configuration)
- OAuth: Admin group claims regex list mapping
- OAuth: Admin auto-populate toggle

**Controller differences:**

- EE has additional validation: `isOAuthAdminMappingFormValid()` (lines 270-281)
- EE has Kerberos initialization logic (lines 299-308)
- EE has admin groups handling in `prepareLDAPSettings()` (lines 207-215)
- EE has Kerberos settings cleanup (lines 190-203)
- EE has OAuth admin settings cleanup (lines 135-137)

## Migration Strategy

This is a **complex, multi-step migration** with the following phases:

### Phase 1: Session Lifetime Section (Simple)

- Migrate session lifetime dropdown to React
- Reuse existing React Select component
- Keep warning message as-is (already using React Icon component)

### Phase 2: LDAP Settings (Most Complex)

LDAP has deeply nested Angular components that need systematic migration:

- Break down into smallest possible units
- Migrate shared subcomponents first (DN builders, security config)
- Then migrate LDAP Custom and OpenLDAP variants
- Handle EE-specific admin groups last

### Phase 3: AD Settings (Complex with EE divergence)

- Similar to LDAP but with AD-specific fields
- EE has additional Kerberos configuration
- Reuse components from Phase 2 where possible

### Phase 4: OAuth Settings (Moderate)

- Has team membership mappings
- EE has admin auto-populate
- Table-based claim mappings

### Phase 5: Final Integration

- Create container component with Formik
- Wire up all authentication methods
- Handle switching between auth methods
- Update routing

## Issue Hierarchy

```
BE-6604 (Parent: Authentication Settings Migration)
├── Session & Page (Parallel)
│   ├── BE-12583: SessionLifetimeSelect
│   └── BE-12584: AuthenticationMethodSelector
│
├── BE-12585: AutoUserProvisionToggle (Shared by LDAP/AD/OAuth)
│
├── BE-12593: LdapSettings Container ⚠️ PARENT ISSUE
│   ├── BE-12586: LdapSettingsDnBuilder
│   ├── BE-12587: LdapSettingsGroupDnBuilder
│   ├── BE-12588: Extend TLSFieldset with StartTLS
│   ├── BE-12589: LdapSettingsTestLogin
│   ├── BE-12590: LdapSettingsCustom (🔒 blocked by 12586-89)
│   ├── BE-12591: LdapSettingsOpenLdap (🔒 blocked by 12586-89)
│   └── BE-12592: [EE] AdminGroupsMultiSelect
│
├── BE-12596: AdSettings Container ⚠️ PARENT ISSUE (🔒 blocked by LDAP shared)
│   ├── BE-12594: [EE] BindTypeSelector
│   └── BE-12595: [EE] KerberosConfigFields
│
├── BE-12600: OAuthSettings Container ⚠️ PARENT ISSUE
│   ├── BE-12597: TeamSelector
│   ├── BE-12598: ClaimMappingsTable
│   └── BE-12599: [EE] AdminAutoPopulateSection
│
├── BE-12601: AuthenticationView Formik Container (🔒 blocked by 12593, 12596, 12600)
│
└── BE-12602: Final Cleanup (🔒 blocked by 12601)
```

## PRs (Nested Structure)

### Session & Page Structure (Parallel - No Dependencies)

- [x] PR 1: [BE-12583](https://linear.app/portainer/issue/BE-12583) SessionLifetimeSelect → react2angular bridge
- [x] PR 2: [BE-12584](https://linear.app/portainer/issue/BE-12584) AuthenticationMethodSelector wrapper (BoxSelector is already React)

### Internal Auth (Already Done!)

- [x] ✅ Internal Auth is already fully migrated to React

### [BE-12593: LDAP Settings](https://linear.app/portainer/issue/BE-12593) (Parent Issue)

- [x] PR 3: [BE-12585](https://linear.app/portainer/issue/BE-12585) AutoUserProvisionToggle → shared component
- **LDAP Shared Components** (Parallel - No Dependencies)
  - [x] PR 4: [BE-12586](https://linear.app/portainer/issue/BE-12586) LdapSettingsDnBuilder
  - [x] PR 5: [BE-12587](https://linear.app/portainer/issue/BE-12587) LdapSettingsGroupDnBuilder
  - [x] PR 6: [BE-12588](https://linear.app/portainer/issue/BE-12588) Extend TLSFieldset with StartTLS
  - [x] PR 7: [BE-12589](https://linear.app/portainer/issue/BE-12589) LdapSettingsTestLogin
- **LDAP Variants** (Blocked by PR 4-7)
  - [ ] PR 8: [BE-12590](https://linear.app/portainer/issue/BE-12590) LdapSettingsCustom
  - [ ] PR 9: [BE-12591](https://linear.app/portainer/issue/BE-12591) LdapSettingsOpenLdap
- **EE Features**
  - [x] PR 10: [BE-12592](https://linear.app/portainer/issue/BE-12592) [EE] AdminGroupsMultiSelect
- **Container** (Blocked by PR 3, 8, 9, 10)
  - [ ] PR 11: [BE-12593](https://linear.app/portainer/issue/BE-12593) LdapSettings container

### [BE-12596: AD Settings](https://linear.app/portainer/issue/BE-12596) (Parent Issue, Blocked by LDAP shared components)

- **AD-Specific Components** (Parallel)
  - [ ] PR 12: [BE-12594](https://linear.app/portainer/issue/BE-12594) [EE] BindTypeSelector
  - [ ] PR 13: [BE-12595](https://linear.app/portainer/issue/BE-12595) [EE] KerberosConfigFields
- **Container** (Blocked by PR 3, 6, 7, 10, 12, 13)
  - [ ] PR 14: [BE-12596](https://linear.app/portainer/issue/BE-12596) AdSettings container

### [BE-12600: OAuth Settings](https://linear.app/portainer/issue/BE-12600) (Parent Issue)

- **OAuth Components** (Parallel)
  - [ ] PR 3: [BE-12585](https://linear.app/portainer/issue/BE-12585) AutoUserProvisionToggle (reused)
  - [ ] PR 15: [BE-12597](https://linear.app/portainer/issue/BE-12597) TeamSelector
  - [ ] PR 16: [BE-12598](https://linear.app/portainer/issue/BE-12598) ClaimMappingsTable
  - [ ] PR 17: [BE-12599](https://linear.app/portainer/issue/BE-12599) [EE] AdminAutoPopulateSection
- **Container** (Blocked by PR 3, 15, 16, 17)
  - [ ] PR 18: [BE-12600](https://linear.app/portainer/issue/BE-12600) OAuthSettings container

### Final Integration (Blocked by All Parent Issues)

- [ ] PR 19: [BE-12601](https://linear.app/portainer/issue/BE-12601) AuthenticationView container (Formik) - **Blocked by BE-12593, BE-12596, BE-12600**
- [ ] PR 20: [BE-12602](https://linear.app/portainer/issue/BE-12602) Complete React migration - **Blocked by PR 19**

## Linear Issue Comparison

The Linear issue BE-6604 provides a detailed breakdown of the component structure. Our migration plan aligns with it:

**Linear's structure notes:**

- ✅ PageHeader - already React
- ✅ Widget - already React
- ✅ InternalAuth - already React
- 📋 Need to migrate: ldap-settings, ad-settings, oauth-settings
- 📋 Need to create: oauth-team-memberships-fieldset, microsoft/google/github/custom-settings
- 📋 Shared components: auto-user-provision-toggle, ldap-connectivity-check, ldap-settings-security, ldap-settings-test-login

**Our approach difference:**

- Linear suggests creating vs migrating OAuth provider settings (microsoft, google, github, custom)
- We'll determine during implementation if these exist in Angular and need migration
- Our plan emphasizes bottom-up approach: migrate shared components first (DN builders, security, test login) before composing larger components

## Decisions

- **InternalAuth**: Already fully migrated to React, can reuse as-is ✅
- **BoxSelector**: Already React component, can reuse ✅
- **TLSFieldset**: Existing component can be extended/wrapped to add StartTLS support ✅
  - LDAP needs: StartTLS toggle + TLS toggle + skip verify + CA cert only (not cert/key)
  - Existing TLSFieldset has: TLS + skip verify + CA cert + cert + key with validation
  - Solution: Extend TLSFieldset with optional StartTLS prop, make cert/key optional
- **Bottom-up approach**: Start with smallest components (DN builders, toggles) before composing into larger components
- **EE handling**: Each PR must work in both CE and EE builds
- **Form validation**: Complex validation logic in controller needs to move into React components (each component exports its validation schema)
- **File upload**: LDAP TLS certificate upload needs special handling
- **Testing**: Focus on unit tests for each component (1-2 tests per file)

## Key Challenges

1. **Deep nesting**: LDAP settings has 3-4 levels of nested components
2. **Shared logic**: DN builders and security config shared between LDAP variants
3. **EE divergence**: Significant differences in LDAP/AD/OAuth between CE and EE
4. **Validation complexity**: Form validation depends on multiple interdependent fields
5. **State management**: Auth method switching, form state, and validation state
6. **File upload**: TLS certificate upload for LDAP

## Technical Notes

- **Validation**: `isLDAPFormValid()` has complex logic checking URLs, auth mode, TLS config, admin groups
- **Password handling**: Special logic for edit mode to avoid requiring password re-entry
- **URL formatting**: Automatically adds port (389 or 636) if not specified
- **Server type switching**: Switching between LDAP and AD affects which fields are shown/validated
- **Kerberos (EE)**: Bind type selector determines which credential fields are shown
