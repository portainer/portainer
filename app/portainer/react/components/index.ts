import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { AnnotationsBeTeaser } from '@/react/kubernetes/annotations/AnnotationsBeTeaser';
import { withFormValidation } from '@/react-tools/withFormValidation';
import { GroupAssociationTable } from '@/react/portainer/environments/environment-groups/components/GroupAssociationTable';
import { AssociatedEnvironmentsSelector } from '@/react/portainer/environments/environment-groups/components/AssociatedEnvironmentsSelector';
import { withControlledInput } from '@/react-tools/withControlledInput';

import {
  EnvironmentVariablesFieldset,
  EnvironmentVariablesPanel,
  StackEnvironmentVariablesPanel,
  envVarValidation,
} from '@@/form-components/EnvironmentVariablesFieldset';
import { Icon } from '@@/Icon';
import { ReactQueryDevtoolsWrapper } from '@@/ReactQueryDevtoolsWrapper';
import { PageHeader } from '@@/PageHeader';
import { TagSelector } from '@@/TagSelector';
import { Loading } from '@@/Widget/Loading';
import { PasswordCheckHint } from '@@/PasswordCheckHint';
import { Tooltip } from '@@/Tip/Tooltip';
import { Badge } from '@@/Badge';
import { TableColumnHeaderAngular } from '@@/datatables/TableHeaderCell';
import { DashboardItem } from '@@/DashboardItem';
import { SearchBar } from '@@/datatables/SearchBar';
import { FallbackImage } from '@@/FallbackImage';
import { BadgeIcon } from '@@/BadgeIcon';
import { TeamsSelector } from '@@/TeamsSelector';
import { TerminalTooltip } from '@@/TerminalTooltip';
import { PortainerSelect } from '@@/form-components/PortainerSelect';
import { Slider } from '@@/form-components/Slider';
import { TagButton } from '@@/TagButton';
import { BETeaserButton } from '@@/BETeaserButton';
import { CodeEditor } from '@@/CodeEditor';
import { HelpLink } from '@@/HelpLink';
import { TextTip } from '@@/Tip/TextTip';

import { fileUploadField } from './file-upload-field';
import { switchField } from './switch-field';
import { customTemplatesModule } from './custom-templates';
import { gitFormModule } from './git-form';
import { settingsModule } from './settings';
import { accessControlModule } from './access-control';
import { environmentsModule } from './environments';
import { registriesModule } from './registries';
import { accountModule } from './account';
import { usersModule } from './users';
import { activityLogsModule } from './activity-logs';
import { rbacModule } from './rbac';

export const ngModule = angular
  .module('portainer.app.react.components', [
    accessControlModule,
    customTemplatesModule,
    environmentsModule,
    gitFormModule,
    registriesModule,
    settingsModule,
    accountModule,
    usersModule,
    activityLogsModule,
    rbacModule,
  ])
  .component(
    'tagSelector',
    r2a(withUIRouter(withReactQuery(TagSelector)), [
      'allowCreate',
      'onChange',
      'value',
      'errors',
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
      'buttonClassName',
      'data-cy',
    ])
  )
  .component(
    'tagButton',
    r2a(TagButton, ['value', 'label', 'title', 'onRemove'])
  )

  .component(
    'portainerTooltip',
    r2a(Tooltip, ['message', 'position', 'className', 'setHtmlMessage', 'size'])
  )
  .component('terminalTooltip', r2a(TerminalTooltip, []))
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
    r2a(FallbackImage, ['src', 'fallbackIcon', 'alt', 'className'])
  )
  .component('prIcon', r2a(Icon, ['className', 'icon', 'mode', 'size', 'spin']))
  .component(
    'reactQueryDevTools',
    r2a(withReactQuery(ReactQueryDevtoolsWrapper), [])
  )
  .component(
    'helpLink',
    r2a(withUIRouter(withReactQuery(HelpLink)), [
      'docLink',
      'target',
      'children',
    ])
  )
  .component(
    'dashboardItem',
    r2a(DashboardItem, [
      'icon',
      'type',
      'value',
      'to',
      'params',
      'children',
      'pluralType',
      'isLoading',
      'isRefetching',
      'data-cy',
      'iconClass',
    ])
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
  .component('badgeIcon', r2a(BadgeIcon, ['icon', 'size', 'iconClass']))
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
      'components',
      'isLoading',
      'noOptionsMessage',
      'aria-label',
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
      'disabled',
    ])
  )
  .component(
    'reactCodeEditor',
    r2a(CodeEditor, [
      'id',
      'placeholder',
      'yaml',
      'dockerFile',
      'shell',
      'readonly',
      'onChange',
      'value',
      'height',
      'data-cy',
      'versions',
      'onVersionChange',
    ])
  )
  .component(
    'textTip',
    r2a(TextTip, [
      'className',
      'color',
      'icon',
      'inline',
      'children',
      'childrenWrapperClassName',
    ])
  )
  .component(
    'groupAssociationTable',
    r2a(withReactQuery(GroupAssociationTable), [
      'onClickRow',
      'query',
      'title',
      'data-cy',
    ])
  )
  .component('annotationsBeTeaser', r2a(AnnotationsBeTeaser, []))
  .component(
    'associatedEndpointsSelector',
    r2a(withReactQuery(AssociatedEnvironmentsSelector), ['onChange', 'value'])
  );

export const componentsModule = ngModule.name;

withFormValidation(
  ngModule,
  withControlledInput(EnvironmentVariablesFieldset, { values: 'onChange' }),
  'environmentVariablesFieldset',
  ['canUndoDelete'],
  envVarValidation
);

withFormValidation(
  ngModule,
  withControlledInput(EnvironmentVariablesPanel, { values: 'onChange' }),
  'environmentVariablesPanel',
  ['explanation', 'showHelpMessage', 'isFoldable'],
  envVarValidation
);

withFormValidation(
  ngModule,
  withUIRouter(
    withReactQuery(
      withControlledInput(StackEnvironmentVariablesPanel, {
        values: 'onChange',
      })
    )
  ),
  'stackEnvironmentVariablesPanel',
  ['showHelpMessage', 'isFoldable'],
  envVarValidation
);
