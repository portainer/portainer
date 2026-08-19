import { renderHook } from '@testing-library/react-hooks';
import { vi } from 'vitest';

import {
  Environment,
  ContainerEngine,
  EnvironmentSecuritySettings,
} from '@/react/portainer/environments/types';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { createMockEnvironment } from '@/react-tools/test-mocks';

import { useCanDuplicateEditContainer } from './useCanDuplicateEditContainer';

let mockEnvironmentData: Environment | undefined;
let mockIsAdmin = true;

vi.mock('@/react/hooks/useCurrentEnvironment', () => ({
  useCurrentEnvironment: vi.fn(() => ({
    data: mockEnvironmentData,
  })),
}));

vi.mock('@/react/hooks/useUser', () => ({
  useIsEdgeAdmin: vi.fn(() => ({
    isAdmin: mockIsAdmin,
  })),
}));

describe('useCanDuplicateEditContainer', () => {
  function createPermissiveSettings(): EnvironmentSecuritySettings {
    return {
      allowContainerCapabilitiesForRegularUsers: true,
      allowBindMountsForRegularUsers: true,
      allowDeviceMappingForRegularUsers: true,
      allowSysctlSettingForRegularUsers: true,
      allowSecurityOptForRegularUsers: true,
      allowHostNamespaceForRegularUsers: true,
      allowPrivilegedModeForRegularUsers: true,
      allowVolumeBrowserForRegularUsers: true,
      allowStackManagementForRegularUsers: true,
      enableHostManagementFeatures: false,
    };
  }

  function createRestrictiveSettings(): EnvironmentSecuritySettings {
    return {
      ...createPermissiveSettings(),
      allowContainerCapabilitiesForRegularUsers: false,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderCustomHook(
    ...params: Parameters<typeof useCanDuplicateEditContainer>
  ) {
    return renderHook(() => useCanDuplicateEditContainer(...params), {
      wrapper: withTestQueryProvider(({ children }) => <>{children}</>),
    });
  }

  it('should return true for Podman container (unlike recreate button)', () => {
    mockEnvironmentData = createMockEnvironment({
      ContainerEngine: ContainerEngine.Podman,
      SecuritySettings: createPermissiveSettings(),
    } as Environment);
    mockIsAdmin = true;

    const { result } = renderCustomHook({
      autoRemove: false,
      partOfSwarmService: false,
    });

    expect(result.current).toBe(true);
  });

  it('should return false when container is in Swarm', () => {
    mockEnvironmentData = createMockEnvironment({
      ContainerEngine: ContainerEngine.Docker,
      SecuritySettings: createPermissiveSettings(),
    } as Environment);
    mockIsAdmin = true;

    const { result } = renderCustomHook({
      autoRemove: false,
      partOfSwarmService: true,
    });

    expect(result.current).toBe(false);
  });

  it('should return false when AutoRemove is enabled', () => {
    mockEnvironmentData = createMockEnvironment({
      ContainerEngine: ContainerEngine.Docker,
      SecuritySettings: createPermissiveSettings(),
    } as Environment);
    mockIsAdmin = true;

    const { result } = renderCustomHook({
      autoRemove: true,
      partOfSwarmService: false,
    });

    expect(result.current).toBe(false);
  });

  it('should return false for regular user with restrictive settings', () => {
    mockEnvironmentData = createMockEnvironment({
      ContainerEngine: ContainerEngine.Docker,
      SecuritySettings: createRestrictiveSettings(),
    } as Environment);
    mockIsAdmin = false;

    const { result } = renderCustomHook({
      autoRemove: false,
      partOfSwarmService: false,
    });

    expect(result.current).toBe(false);
  });

  it('should return true for regular user with permissive settings', () => {
    mockEnvironmentData = createMockEnvironment({
      ContainerEngine: ContainerEngine.Docker,
      SecuritySettings: createPermissiveSettings(),
    } as Environment);
    mockIsAdmin = false;

    const { result } = renderCustomHook({
      autoRemove: false,
      partOfSwarmService: false,
    });

    expect(result.current).toBe(true);
  });
});
