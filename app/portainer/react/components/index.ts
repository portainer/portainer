import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import {
  DefaultRegistryAction,
  DefaultRegistryDomain,
  DefaultRegistryName,
} from '@/react/portainer/registries/ListView/DefaultRegistry';
import { Icon } from '@/react/components/Icon';
import { ReactQueryDevtoolsWrapper } from '@/react/components/ReactQueryDevtoolsWrapper';
import { AccessControlPanel } from '@/react/portainer/access-control';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { SettingsFDO } from '@/react/portainer/settings/EdgeComputeView/SettingsFDO';
import { SettingsOpenAMT } from '@/react/portainer/settings/EdgeComputeView/SettingsOpenAMT';
import { InternalAuth } from '@/react/portainer/settings/AuthenticationView/InternalAuth';
import { PorAccessControlFormTeamSelector } from '@/react/portainer/access-control/PorAccessControlForm/TeamsSelector';
import { PorAccessControlFormUserSelector } from '@/react/portainer/access-control/PorAccessControlForm/UsersSelector';
import { PorAccessManagementUsersSelector } from '@/react/portainer/access-control/AccessManagement/PorAccessManagementUsersSelector';

import { PageHeader } from '@@/PageHeader';
import { TagSelector } from '@@/TagSelector';
import { Loading } from '@@/Widget/Loading';
import { PasswordCheckHint } from '@@/PasswordCheckHint';
import { ViewLoading } from '@@/ViewLoading';
import { Tooltip } from '@@/Tip/Tooltip';
import { Badge } from '@@/Badge';
import { TableColumnHeaderAngular } from '@@/datatables/TableHeaderCell';
import { DashboardItem } from '@@/DashboardItem';
import { SearchBar } from '@@/datatables/SearchBar';
import { FallbackImage } from '@@/FallbackImage';
import { BadgeIcon } from '@@/BadgeIcon';
import { TeamsSelector } from '@@/TeamsSelector';
import { PortainerSelect } from '@@/form-components/PortainerSelect';
import { Slider } from '@@/form-components/Slider';
import { TagButton } from '@@/TagButton';

import { fileUploadField } from './file-upload-field';
import { switchField } from './switch-field';
import { customTemplatesModule } from './custom-templates';

export const componentsModule = angular
  .module('portainer.app.react.components', [customTemplatesModule])
  .component(
    'tagSelector',
    r2a(withReactQuery(TagSelector), ['allowCreate', 'onChange', 'value'])
  )
  .component(
    'tagButton',
    r2a(TagButton, ['value', 'label', 'title', 'onRemove'])
  )
  .component(
    'portainerTooltip',
    r2a(Tooltip, ['message', 'position', 'className', 'setHtmlMessage'])
  )
  .component('badge', r2a(Badge, ['type', 'className']))
  .component('fileUploadField', fileUploadField)
  .component('porSwitchField', switchField)
  .component(
    'passwordCheckHint',
    r2a(withReactQuery(PasswordCheckHint), [
      'forceChangePassword',
      'passwordValid',
    ])
  )
  .component('rdLoading', r2a(Loading, []))
  .component(
    'tableColumnHeader',
    r2a(TableColumnHeaderAngular, [
      'colTitle',
      'canSort',
      'isSorted',
      'isSortedDesc',
    ])
  )
  .component('viewLoading', r2a(ViewLoading, ['message']))
  .component(
    'pageHeader',
    r2a(withUIRouter(withReactQuery(withCurrentUser(PageHeader))), [
      'title',
      'breadcrumbs',
      'loading',
      'onReload',
      'reload',
      'id',
    ])
  )
  .component(
    'fallbackImage',
    r2a(FallbackImage, ['src', 'fallbackIcon', 'alt', 'size', 'className'])
  )
  .component('prIcon', r2a(Icon, ['className', 'icon', 'mode', 'size']))
  .component('reactQueryDevTools', r2a(ReactQueryDevtoolsWrapper, []))
  .component(
    'dashboardItem',
    r2a(DashboardItem, ['icon', 'type', 'value', 'children'])
  )
  .component(
    'datatableSearchbar',
    r2a(SearchBar, [
      'data-cy',
      'onChange',
      'value',
      'placeholder',
      'children',
      'className',
    ])
  )
  .component('badgeIcon', r2a(BadgeIcon, ['icon', 'size']))
  .component(
    'accessControlPanel',
    r2a(withUIRouter(withReactQuery(withCurrentUser(AccessControlPanel))), [
      'disableOwnershipChange',
      'onUpdateSuccess',
      'resourceControl',
      'resourceId',
      'resourceType',
      'environmentId',
    ])
  )
  .component(
    'defaultRegistryName',
    r2a(withReactQuery(DefaultRegistryName), [])
  )
  .component(
    'defaultRegistryAction',
    r2a(withReactQuery(DefaultRegistryAction), [])
  )
  .component(
    'defaultRegistryDomain',
    r2a(withReactQuery(DefaultRegistryDomain), [])
  )
  .component(
    'settingsFdo',
    r2a(withUIRouter(withReactQuery(SettingsFDO)), ['onSubmit', 'settings'])
  )
  .component('settingsOpenAmt', r2a(SettingsOpenAMT, ['onSubmit', 'settings']))
  .component(
    'internalAuth',
    r2a(InternalAuth, ['onSaveSettings', 'isLoading', 'value', 'onChange'])
  )
  .component(
    'teamsSelector',
    r2a(TeamsSelector, [
      'onChange',
      'value',
      'dataCy',
      'inputId',
      'name',
      'placeholder',
      'teams',
      'disabled',
    ])
  )
  .component(
    'porAccessControlFormTeamSelector',
    r2a(PorAccessControlFormTeamSelector, [
      'inputId',
      'onChange',
      'options',
      'value',
    ])
  )
  .component(
    'porAccessControlFormUserSelector',
    r2a(PorAccessControlFormUserSelector, [
      'inputId',
      'onChange',
      'options',
      'value',
    ])
  )
  .component(
    'porSelect',
    r2a(PortainerSelect, [
      'name',
      'inputId',
      'placeholder',
      'disabled',
      'data-cy',
      'bindToBody',
      'value',
      'onChange',
      'options',
      'isMulti',
      'isClearable',
    ])
  )
  .component(
    'porSlider',
    r2a(Slider, [
      'min',
      'max',
      'step',
      'value',
      'onChange',
      'visibleTooltip',
      'dataCy',
    ])
  )
  .component(
    'porAccessManagementUsersSelector',
    r2a(PorAccessManagementUsersSelector, ['onChange', 'options', 'value'])
  ).name;
