import { UIRouterContextComponent } from '@uirouter/react-hybrid';
import ReactDOM from 'react-dom';
import { IComponentOptions, IController } from 'angular';

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

export function react2angular<T>(
  Component: React.ComponentType<T>,
  propNames: string[]
): IComponentOptions {
  const bindings = Object.fromEntries(propNames.map((key) => [key, '<']));

  return {
    bindings,
    controller: Controller,
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
        <UIRouterContextComponent>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <Component {...(props as T)} />
        </UIRouterContextComponent>,
        el
      );
    };
    this.$onDestroy = () => ReactDOM.unmountComponentAtNode(el);
  }
}

export const r2a = react2angular;
