import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { CreateAccessToken } from '@/react/portainer/account/CreateAccessTokenView';
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
import { withI18nSuspense } from '@/react-tools/withI18nSuspense';

import { PageHeader } from '@@/PageHeader';
import { TagSelector } from '@@/TagSelector';
import { Loading } from '@@/Widget/Loading';
import { PasswordCheckHint } from '@@/PasswordCheckHint';
import { ViewLoading } from '@@/ViewLoading';
import { Tooltip } from '@@/Tip/Tooltip';
import { TableColumnHeaderAngular } from '@@/datatables/TableHeaderCell';
import { DashboardItem } from '@@/DashboardItem';
import { SearchBar } from '@@/datatables/SearchBar';
import { FallbackImage } from '@@/FallbackImage';
import { BadgeIcon } from '@@/BoxSelector/BadgeIcon';

import { fileUploadField } from './file-upload-field';
import { switchField } from './switch-field';
import { customTemplatesModule } from './custom-templates';

export const componentsModule = angular
  .module('portainer.app.react.components', [customTemplatesModule])
  .component(
    'tagSelector',
    r2a(withReactQuery(TagSelector), ['allowCreate', 'onChange', 'value'])
  )
  .component('portainerTooltip', r2a(Tooltip, ['message', 'position']))
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
    ])
  )
  .component(
    'fallbackImage',
    r2a(FallbackImage, [
      'src',
      'fallbackIcon',
      'alt',
      'size',
      'className',
      'fallbackMode',
      'fallbackClassName',
      'feather',
    ])
  )
  .component(
    'prIcon',
    r2a(Icon, ['className', 'feather', 'icon', 'mode', 'size'])
  )
  .component('reactQueryDevTools', r2a(ReactQueryDevtoolsWrapper, []))
  .component(
    'dashboardItem',
    r2a(DashboardItem, ['featherIcon', 'icon', 'type', 'value', 'children'])
  )
  .component(
    'datatableSearchbar',
    r2a(SearchBar, ['data-cy', 'onChange', 'value', 'placeholder'])
  )
  .component('boxSelectorBadgeIcon', r2a(BadgeIcon, ['featherIcon', 'icon']))
  .component(
    'accessControlPanel',
    r2a(withCurrentUser(AccessControlPanel), [
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
    'createAccessToken',
    r2a(withI18nSuspense(withUIRouter(CreateAccessToken)), [
      'onSubmit',
      'onError',
    ])
  ).name;
