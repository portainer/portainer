import ReactDOM from 'react-dom';
import { IComponentOptions, IController } from 'angular';
import { ComponentType, StrictMode } from 'react';
import _ from 'lodash';

function toProps(
  propNames: string[],
  controller: IController,
  $q: ng.IQService
) {
  return Object.fromEntries(
    propNames.map((key) => {
      const prop = controller[key];
      if (typeof prop !== 'function') {
        return [key, prop];
      }

      return [
        key,
        (...args: unknown[]) =>
          $q((resolve) => resolve(controller[key](...args))),
      ];
    })
  );
}

type PropNames<T> = Exclude<keyof T, number | symbol>;

/**
 * react2angular is used to bind a React component to an AngularJS component
 * it used in an AngularJS module definition:
 *
 * `.component('componentName', react2angular(ComponentName, ['prop1', 'prop2']))`
 *
 * if the second parameter has any ts errors check that the component has the correct props
 */
export function react2angular<TProps>(
  Component: ComponentType<TProps>,
  propNames: PropNames<TProps>[] = []
): IComponentOptions & { name: string } {
  const bindings = Object.fromEntries(propNames.map((key) => [key, '<']));

  return {
    bindings,
    controller: Controller,
    name: _.camelCase(Component.displayName || Component.name),
  };

  /* @ngInject */
  function Controller(
    this: IController,
    $element: HTMLElement[],
    $q: ng.IQService
  ) {
    const el = $element[0];
    this.$onChanges = () => {
      const props = toProps(propNames, this, $q);
      ReactDOM.render(
        <StrictMode>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <Component {...(props as TProps)} />
        </StrictMode>,

        el
      );
    };
    this.$onDestroy = () => ReactDOM.unmountComponentAtNode(el);
  }
}

export const r2a = react2angular;
