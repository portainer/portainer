import { ComponentType } from 'react';
import {
  ReactStateDeclaration,
  UIRouter,
  UIRouterReact,
  UIView,
  hashLocationPlugin,
  servicesPlugin,
} from '@uirouter/react';

/**
 * A helper function to wrap a component with a UIRouter Provider.
 *
 * should only be used in tests
 */
export function withTestRouter<T>(
  WrappedComponent: ComponentType<T>,
  {
    route = '/',
    stateConfig = [],
  }: { route?: string; stateConfig?: Array<ReactStateDeclaration> } = {}
): ComponentType<T> {
  const router = new UIRouterReact();

  // router.trace.enable(Category.TRANSITION);
  router.plugin(servicesPlugin);
  router.plugin(hashLocationPlugin);

  // Set up your custom state configuration
  stateConfig.forEach((state) => router.stateRegistry.register(state));
  router.urlService.rules.initial({ state: route });

  // Try to create a nice displayName for React Dev Tools.
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WrapperComponent(props: T & JSX.IntrinsicAttributes) {
    return (
      <UIRouter router={router}>
        <UIView />
        <WrappedComponent {...props} />
      </UIRouter>
    );
  }

  WrapperComponent.displayName = `withTestRouter(${displayName})`;

  return WrapperComponent;
}
