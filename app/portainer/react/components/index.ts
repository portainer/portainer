import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { Icon } from '@/react/components/Icon';
import { ReactQueryDevtoolsWrapper } from '@/react/components/ReactQueryDevtoolsWrapper';

import { PageHeader } from '@@/PageHeader';
import { TagSelector } from '@@/TagSelector';
import { Loading } from '@@/Widget/Loading';
import { PasswordCheckHint } from '@@/PasswordCheckHint';
import { ViewLoading } from '@@/ViewLoading';
import { Tooltip } from '@@/Tip/Tooltip';
import { TableColumnHeaderAngular } from '@@/datatables/TableHeaderCell';
import { DashboardItem } from '@@/DashboardItem';
import { SearchBar } from '@@/datatables/SearchBar';

import { fileUploadField } from './file-upload-field';
import { switchField } from './switch-field';
import { customTemplatesModule } from './custom-templates';

export const componentsModule = angular
  .module('portainer.app.react.components', [customTemplatesModule])
  .component(
    'tagSelector',
    r2a(TagSelector, ['allowCreate', 'onChange', 'value'])
  )
  .component('portainerTooltip', r2a(Tooltip, ['message', 'position']))
  .component('fileUploadField', fileUploadField)
  .component('porSwitchField', switchField)
  .component(
    'passwordCheckHint',
    r2a(PasswordCheckHint, ['forceChangePassword', 'passwordValid'])
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
    r2a(PageHeader, ['title', 'breadcrumbs', 'loading', 'onReload', 'reload'])
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
  ).name;
