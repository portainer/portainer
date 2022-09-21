import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useReducer,
} from 'react';
import angular, { IScope } from 'angular';
import _ from 'lodash';

import * as storage from '@/portainer/hooks/useLocalStorage';

// using bootstrap breakpoint - https://getbootstrap.com/docs/5.0/layout/breakpoints/#min-width
const mobileWidth = 992;
const storageKey = 'toolbar_toggle';

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
  const state = useSidebarStateLocal();

  return <Context.Provider value={state}> {children} </Context.Provider>;
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

function useSidebarStateLocal() {
  const [storageIsOpen, setIsOpenInStorage] = storage.useLocalStorage(
    storageKey,
    true
  );
  const [isOpen, setIsOpen, undoIsOpenChange] = useStateWithUndo(
    initialState()
  );

  const onResize = useMemo(
    () =>
      _.debounce(() => {
        if (isMobile()) {
          if (isOpen) {
            setIsOpen(false);
          }
        } else {
          undoIsOpenChange();
        }
      }, 50),
    [setIsOpen, undoIsOpenChange, isOpen]
  );

  useUpdateAngularService(isOpen);

  useEffect(() => {
    if (window.ddExtension) {
      return undefined;
    }

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [onResize]);

  return {
    isOpen,
    toggle,
  };

  function toggle(value = !isOpen) {
    setIsOpenInStorage(value);
    setIsOpen(value);
  }

  function initialState() {
    if (isMobile() || window.ddExtension) {
      return false;
    }

    return storageIsOpen;
  }
}

function useStateWithUndo<T>(
  initialState: T
): [T, (value: T) => void, () => void] {
  const [state, setState] = useState(initialState);
  const prevState = useRef<T>();

  const undo = useCallback(() => {
    if (!prevState.current) {
      return;
    }

    setState(prevState.current);
    prevState.current = undefined;
  }, [prevState]);

  const handleSetState = useCallback(
    (newState: T) => {
      prevState.current = state;
      setState(newState);
    },
    [state]
  );

  return [state, handleSetState, undo];
}

function useUpdateAngularService(isOpen: boolean) {
  useEffect(() => {
    // to sync "outside state" - for angularjs
    const $injector = angular.element(document).injector();
    $injector.invoke(
      /* @ngInject */ (
        SidebarService: ReturnType<typeof AngularSidebarService>
      ) => {
        SidebarService.setIsOpen(isOpen);
      }
    );
  }, [isOpen]);
}

function isMobile() {
  const width = window.innerWidth;

  return width < mobileWidth;
}
