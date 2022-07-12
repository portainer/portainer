import ReactDOM from 'react-dom';
import { IComponentOptions, IController } from 'angular';
import { Suspense } from 'react';
import _ from 'lodash';

import { RootProvider } from './RootProvider';

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
export function react2angular<T, U extends PropNames<T>[]>(
  Component: React.ComponentType<T>,
  propNames: U & ([PropNames<T>] extends [U[number]] ? unknown : PropNames<T>)
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
        <Suspense fallback="loading translations">
          <RootProvider>
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <Component {...(props as T)} />
          </RootProvider>
        </Suspense>,
        el
      );
    };
    this.$onDestroy = () => ReactDOM.unmountComponentAtNode(el);
  }
}

export const r2a = react2angular;
