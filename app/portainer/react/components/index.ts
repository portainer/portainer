import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';

import { Icon } from '@@/Icon';
import { ReactQueryDevtoolsWrapper } from '@@/ReactQueryDevtoolsWrapper';
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
import { BETeaserButton } from '@@/BETeaserButton';
import { CodeEditor } from '@@/CodeEditor';

import { fileUploadField } from './file-upload-field';
import { switchField } from './switch-field';
import { customTemplatesModule } from './custom-templates';
import { gitFormModule } from './git-form';
import { settingsModule } from './settings';
import { accessControlModule } from './access-control';
import { envListModule } from './enviroments-list-view-components';

export const componentsModule = angular
  .module('portainer.app.react.components', [
    customTemplatesModule,
    gitFormModule,
    settingsModule,
    accessControlModule,
    envListModule,
  ])
  .component(
    'tagSelector',
    r2a(withUIRouter(withReactQuery(TagSelector)), [
      'allowCreate',
      'onChange',
      'value',
    ])
  )
  .component(
    'beTeaserButton',
    r2a(BETeaserButton, [
      'featureId',
      'heading',
      'message',
      'buttonText',
      'className',
      'icon',
      'buttonClassName',
    ])
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
    'reactCodeEditor',
    r2a(CodeEditor, [
      'id',
      'placeholder',
      'yaml',
      'readonly',
      'onChange',
      'value',
      'height',
    ])
  ).name;
