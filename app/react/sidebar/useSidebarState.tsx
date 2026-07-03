import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useReducer,
} from 'react';
import angular, { IScope } from 'angular';
import _ from 'lodash';

import { sidebarStore } from './sidebarStore';

// using bootstrap breakpoint - https://getbootstrap.com/docs/5.0/layout/breakpoints/#min-width
const mobileWidth = 992;

interface State {
  isOpen: boolean;
  toggle(): void;
}

export const Context = createContext<State | null>(null);
Context.displayName = 'SidebarContext';

export function useSidebarState() {
  const context = useContext(Context);

  if (!context) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }

  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const { isOpen, toggle, setOpen } = sidebarStore();
  const prevIsOpen = useRef<boolean | null>(null);

  useUpdateAngularService(isOpen);

  useEffect(() => {
    if (window.ddExtension) {
      return undefined;
    }

    const onResize = _.debounce(() => {
      const currentIsOpen = sidebarStore.getState().isOpen;
      if (isMobile()) {
        if (currentIsOpen) {
          prevIsOpen.current = currentIsOpen;
          setOpen(false);
        }
      } else if (prevIsOpen.current !== null) {
        setOpen(prevIsOpen.current);
        prevIsOpen.current = null;
      }
    }, 50);

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setOpen]);

  const state = useMemo(() => ({ isOpen, toggle }), [isOpen, toggle]);

  return <Context.Provider value={state}>{children}</Context.Provider>;
}

export function TestSidebarProvider({ children }: PropsWithChildren<unknown>) {
  const [isOpen, toggle] = useReducer((state) => !state, true);

  const state = useMemo(
    () => ({ isOpen, toggle: () => toggle() }),
    [isOpen, toggle]
  );

  return <Context.Provider value={state}> {children} </Context.Provider>;
}

/* @ngInject */
export function AngularSidebarService($rootScope: IScope) {
  const state = {
    isOpen: false,
  };

  function isSidebarOpen() {
    return state.isOpen;
  }

  function setIsOpen(isOpen: boolean) {
    $rootScope.$evalAsync(() => {
      state.isOpen = isOpen;
    });
  }

  return { isSidebarOpen, setIsOpen };
}

function useUpdateAngularService(isOpen: boolean) {
  useEffect(() => {
    // to sync "outside state" - for angularjs
    const $injector = angular.element(document).injector();
    $injector?.invoke(
      /* @ngInject */ (
        SidebarService: ReturnType<typeof AngularSidebarService>
      ) => {
        SidebarService.setIsOpen(isOpen);
      }
    );
  }, [isOpen]);
}

function isMobile() {
  return window.innerWidth < mobileWidth;
}
