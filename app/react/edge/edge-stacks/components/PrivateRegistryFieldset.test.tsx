import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Registry } from '@/react/portainer/registries/types/registry';
import selectEvent from '@/react/test-utils/react-select';

import {
  REGISTRY_CREDENTIALS_ENABLED,
  PrivateRegistryFieldset,
} from './PrivateRegistryFieldset';

describe('Initial rendering', () => {
  it('should render with use credentials switch unchecked by default', () => {
    renderComponent();

    const checkbox = screen.getByRole('checkbox', { name: /use credentials/i });
    expect(checkbox).toBeVisible();
    expect(checkbox).not.toBeChecked();
  });

  it('should render with use credentials switch checked when value is defined', () => {
    renderComponent({ value: REGISTRY_CREDENTIALS_ENABLED });

    const checkbox = screen.getByRole('checkbox', { name: /use credentials/i });
    expect(checkbox).toBeChecked();
  });

  it('should disable switch when formInvalid is true', () => {
    renderComponent({ formInvalid: true });

    const checkbox = screen.getByRole('checkbox', { name: /use credentials/i });
    expect(checkbox).toBeDisabled();
  });
});

describe('Switch interaction', () => {
  it('should call onChange when switch is toggled on', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderComponent({ onChange });

    const checkbox = screen.getByRole('checkbox', { name: /use credentials/i });
    await user.click(checkbox);

    expect(onChange).toHaveBeenCalledWith(REGISTRY_CREDENTIALS_ENABLED);
  });

  it('should call onChange with undefined when switch is toggled off', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderComponent({ value: REGISTRY_CREDENTIALS_ENABLED, onChange });

    expect(
      screen.queryByLabelText('Registry', { selector: 'input' })
    ).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', { name: /use credentials/i });
    await user.click(checkbox);

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('should not call onChange on initial mount', () => {
    const onChange = vi.fn();
    renderComponent({ onChange });

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Registry selection', () => {
  it('should display registry selector with all registries when switch is on', async () => {
    const user = userEvent.setup();
    renderComponent({ value: REGISTRY_CREDENTIALS_ENABLED });

    expect(
      screen.getByLabelText('Registry', { selector: 'input' })
    ).toBeVisible();

    const selector = screen.getByLabelText('Registry', { selector: 'input' });
    await user.click(selector);

    await waitFor(() => {
      expect(screen.getByText('Docker Hub')).toBeVisible();
      expect(screen.getByText('Azure Container Registry')).toBeVisible();
      expect(screen.getByText('Private Registry')).toBeVisible();
    });
  });

  it('should show selected registry when value is provided', async () => {
    renderComponent({ value: 1 });

    const selector = screen.getByLabelText('Registry', { selector: 'input' });
    expect(selector).toBeVisible();

    expect(screen.getByText('Docker Hub')).toBeVisible();
  });

  it('should call onChange when a registry is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderComponent({ value: REGISTRY_CREDENTIALS_ENABLED, onChange });

    // Find the react-select input using the combobox role
    const input = screen.getByLabelText('Registry', { selector: 'input' });
    await selectEvent.select(input, 'Azure Container Registry', { user });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(2);
    });
  });

  it('should update selected value when value prop changes', async () => {
    const { rerender } = renderComponent({ value: 1 });

    expect(screen.getByText('Docker Hub')).toBeVisible();

    rerender(
      <PrivateRegistryFieldset
        value={2}
        registries={getMockRegistries()}
        onChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Azure Container Registry')).toBeVisible();
    });
  });

  it('should call onChange when user switches between registries', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderComponent({ value: 1, onChange }); // Docker Hub already selected

    expect(screen.getByText('Docker Hub')).toBeVisible();

    const input = screen.getByLabelText('Registry', { selector: 'input' });
    await selectEvent.select(input, 'Azure Container Registry', { user });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(2);
    });
  });
});

describe('Reload functionality', () => {
  it('should show reload button when method is not repository and onReload is provided', async () => {
    renderComponent({
      value: REGISTRY_CREDENTIALS_ENABLED,
      method: 'file',
      onReload: vi.fn(),
    });

    expect(screen.getByRole('button', { name: 'Reload' })).toBeVisible();
  });

  it('should not show reload button when method is repository', () => {
    renderComponent({
      value: REGISTRY_CREDENTIALS_ENABLED,
      method: 'repository',
      onReload: vi.fn(),
    });

    expect(
      screen.queryByTestId('private-registry-reload-button')
    ).not.toBeInTheDocument();
  });

  it('should call onReload when reload button is clicked', async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    renderComponent({ value: 1, method: 'file', onReload });

    const reloadButton = screen.getByRole('button', { name: 'Reload' });
    await user.click(reloadButton);

    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it('should show blue tip when method is not repository and switch is on', () => {
    renderComponent({ value: REGISTRY_CREDENTIALS_ENABLED, method: 'file' });

    expect(
      screen.getByText(
        /If you make any changes to the image urls in your yaml/i
      )
    ).toBeVisible();
  });

  it('should not show blue tip when method is repository', () => {
    renderComponent({
      value: REGISTRY_CREDENTIALS_ENABLED,
      method: 'repository',
    });

    expect(
      screen.queryByText(
        /If you make any changes to the image urls in your yaml/i
      )
    ).not.toBeInTheDocument();
  });

  it('should not call onReload when switch is toggled off', async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    renderComponent({ value: 1, method: 'file', onReload });

    const checkbox = screen.getByRole('checkbox', { name: /use credentials/i });
    await user.click(checkbox);

    expect(onReload).not.toHaveBeenCalled();
  });
});

describe('Error handling', () => {
  it('should display error message when errorMessage is provided', async () => {
    const errorMessage = 'Images need to be from a single registry';
    renderComponent({ value: REGISTRY_CREDENTIALS_ENABLED, errorMessage });

    expect(screen.getByText(errorMessage)).toBeVisible();
  });

  it('should not display registry selector when error message is shown', async () => {
    const errorMessage = 'Images need to be from a single registry';
    renderComponent({ value: REGISTRY_CREDENTIALS_ENABLED, errorMessage });

    expect(
      screen.queryByLabelText('Registry', { selector: 'input' })
    ).not.toBeInTheDocument();
  });
});

describe('Edge cases', () => {
  it('should handle single registry option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const [singleRegistry] = getMockRegistries();
    renderComponent({
      registries: [singleRegistry],
      value: REGISTRY_CREDENTIALS_ENABLED,
      onChange,
    });

    const input = screen.getByLabelText('Registry', { selector: 'input' });
    await selectEvent.select(input, 'Docker Hub', { user });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(1);
    });
  });

  it('should handle empty registries array', () => {
    renderComponent({ registries: [], value: REGISTRY_CREDENTIALS_ENABLED });

    expect(
      screen.getByLabelText('Registry', { selector: 'input' })
    ).toBeVisible();
  });

  it('should handle undefined value', () => {
    renderComponent({ value: undefined });

    expect(
      screen.queryByLabelText('Registry', { selector: 'input' })
    ).not.toBeInTheDocument();
  });

  it('should handle value changing from undefined to defined', async () => {
    const { rerender } = renderComponent({ value: undefined });

    const checkbox = screen.getByRole('checkbox', { name: /use credentials/i });
    expect(checkbox).not.toBeChecked();

    rerender(
      <PrivateRegistryFieldset
        registries={getMockRegistries()}
        onChange={vi.fn()}
        value={REGISTRY_CREDENTIALS_ENABLED}
      />
    );

    expect(checkbox).toBeChecked();
  });

  it('should preserve registry selection after reload', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onReload = vi.fn();
    renderComponent({ value: 1, method: 'file', onChange, onReload });

    await waitFor(() => {
      expect(screen.getByText('Docker Hub')).toBeVisible();
    });

    const reloadButton = screen.getByRole('button', { name: 'Reload' });
    await user.click(reloadButton);

    expect(onReload).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled(); // Registry selection unchanged
    expect(screen.getByText('Docker Hub')).toBeVisible();
  });

  it('should handle value changing from defined to undefined', async () => {
    const { rerender } = renderComponent({ value: 1 });

    expect(screen.getByText('Docker Hub')).toBeVisible();

    rerender(
      <PrivateRegistryFieldset
        value={undefined}
        registries={getMockRegistries()}
        onChange={vi.fn()}
      />
    );

    // Registry selector should be hidden when value is undefined
    await waitFor(() => {
      expect(screen.queryByText('Docker Hub')).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText('Registry', { selector: 'input' })
      ).not.toBeInTheDocument();
    });
  });

  it('should handle registry ID that does not exist in registries array', () => {
    renderComponent({ value: 999 }); // Non-existent ID

    const selector = screen.getByLabelText('Registry', { selector: 'input' });
    expect(selector).toBeVisible();

    // Should not crash, selector should be empty (no selection shown)
    expect(screen.queryByText('Docker Hub')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Azure Container Registry')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Private Registry')).not.toBeInTheDocument();
  });
});

function getMockRegistries(): Registry[] {
  return [
    {
      Id: 1,
      Name: 'Docker Hub',
      URL: 'docker.io',
      Type: 6,
      BaseURL: '',
      Authentication: true,
      Username: 'user1',
      RegistryAccesses: null,
      Gitlab: { ProjectId: 0, InstanceURL: '', ProjectPath: '' },
      Quay: { OrganisationName: '' },
      Github: { UseOrganisation: false, OrganisationName: '' },
      Ecr: { Region: '' },
    },
    {
      Id: 2,
      Name: 'Azure Container Registry',
      URL: 'acr.io',
      Type: 2,
      BaseURL: '',
      Authentication: true,
      Username: 'user2',
      RegistryAccesses: null,
      Gitlab: { ProjectId: 0, InstanceURL: '', ProjectPath: '' },
      Quay: { OrganisationName: '' },
      Github: { UseOrganisation: false, OrganisationName: '' },
      Ecr: { Region: '' },
    },
    {
      Id: 3,
      Name: 'Private Registry',
      URL: 'registry.example.com',
      Type: 3,
      BaseURL: '',
      Authentication: true,
      Username: 'user3',
      RegistryAccesses: null,
      Gitlab: { ProjectId: 0, InstanceURL: '', ProjectPath: '' },
      Quay: { OrganisationName: '' },
      Github: { UseOrganisation: false, OrganisationName: '' },
      Ecr: { Region: '' },
    },
  ];
}

function renderComponent(
  props: Partial<Parameters<typeof PrivateRegistryFieldset>[0]> = {}
) {
  const defaultProps = {
    registries: getMockRegistries(),
    onChange: vi.fn(),
  };

  const mergedProps = { ...defaultProps, ...props };

  return render(<PrivateRegistryFieldset {...mergedProps} />);
}
