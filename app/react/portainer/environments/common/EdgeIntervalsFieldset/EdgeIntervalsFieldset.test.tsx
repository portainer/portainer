import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpResponse } from 'msw';
import { ComponentProps } from 'react';

import { server, http } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { EdgeIntervalsFieldset } from './EdgeIntervalsFieldset';
import { getDefaultEdgeIntervalsValues } from './types';

describe('EdgeIntervalsFieldset', () => {
  beforeEach(() => {
    // Mock settings endpoint for useIntervalOptions hook
    server.use(
      http.get('/api/settings', () =>
        HttpResponse.json({
          Edge: {
            PingInterval: 60,
            SnapshotInterval: 300,
            CommandInterval: 60,
          },
          EdgeAgentCheckinInterval: 5,
        })
      )
    );
  });

  describe('sync mode', () => {
    it('should render poll frequency field in sync mode', async () => {
      renderComponent({ asyncMode: false });

      await waitFor(() => {
        expect(screen.getByText('Poll frequency')).toBeVisible();
      });

      expect(
        screen.getByRole('combobox', { name: /poll frequency/i })
      ).toBeVisible();
    });

    it('should call onChange with updated checkinInterval when changed', async () => {
      const onChange = vi.fn();
      const initialValue = getDefaultEdgeIntervalsValues();

      renderComponent({
        asyncMode: false,
        value: initialValue,
        onChange,
      });

      await waitFor(() => {
        expect(
          screen.getByRole('combobox', { name: /poll frequency/i })
        ).toBeVisible();
      });

      const select = screen.getByRole('combobox', { name: /poll frequency/i });
      await userEvent.selectOptions(select, '5');

      expect(onChange).toHaveBeenCalledWith({
        ...initialValue,
        checkinInterval: 5,
      });
    });

    it('should not render async interval fields in sync mode', async () => {
      renderComponent({ asyncMode: false });

      await waitFor(() => {
        expect(screen.getByText('Poll frequency')).toBeVisible();
      });

      expect(screen.queryByText('Ping interval')).not.toBeInTheDocument();
      expect(screen.queryByText('Snapshot interval')).not.toBeInTheDocument();
      expect(screen.queryByText('Command interval')).not.toBeInTheDocument();
    });
  });

  describe('async mode', () => {
    it('should render async interval fields in async mode', async () => {
      renderComponent({ asyncMode: true });

      await waitFor(() => {
        expect(screen.getByText('Ping interval')).toBeVisible();
      });

      expect(screen.getByText('Snapshot interval')).toBeVisible();
      expect(screen.getByText('Command interval')).toBeVisible();
    });

    it('should call onChange with updated pingInterval when changed', async () => {
      const onChange = vi.fn();
      const initialValue = getDefaultEdgeIntervalsValues();

      renderComponent({
        asyncMode: true,
        value: initialValue,
        onChange,
      });

      await waitFor(() => {
        expect(screen.getByText('Ping interval')).toBeVisible();
      });

      const select = screen.getByRole('combobox', { name: /ping interval/i });
      await userEvent.selectOptions(select, '60');

      expect(onChange).toHaveBeenCalledWith({
        ...initialValue,
        pingInterval: 60,
      });
    });

    it('should call onChange with updated snapshotInterval when changed', async () => {
      const onChange = vi.fn();
      const initialValue = getDefaultEdgeIntervalsValues();

      renderComponent({
        asyncMode: true,
        value: initialValue,
        onChange,
      });

      await waitFor(() => {
        expect(screen.getByText('Snapshot interval')).toBeVisible();
      });

      const select = screen.getByRole('combobox', {
        name: /snapshot interval/i,
      });
      await userEvent.selectOptions(select, '3600');

      expect(onChange).toHaveBeenCalledWith({
        ...initialValue,
        snapshotInterval: 3600,
      });
    });

    it('should call onChange with updated commandInterval when changed', async () => {
      const onChange = vi.fn();
      const initialValue = getDefaultEdgeIntervalsValues();

      renderComponent({
        asyncMode: true,
        value: initialValue,
        onChange,
      });

      await waitFor(() => {
        expect(screen.getByText('Command interval')).toBeVisible();
      });

      const select = screen.getByRole('combobox', {
        name: /command interval/i,
      });
      await userEvent.selectOptions(select, '3600');

      expect(onChange).toHaveBeenCalledWith({
        ...initialValue,
        commandInterval: 3600,
      });
    });

    it('should not render poll frequency field in async mode', async () => {
      renderComponent({ asyncMode: true });

      await waitFor(() => {
        expect(screen.getByText('Ping interval')).toBeVisible();
      });

      expect(screen.queryByText('Poll frequency')).not.toBeInTheDocument();
    });
  });

  describe('readonly mode', () => {
    it('should disable fields when readonly is true in sync mode', async () => {
      renderComponent({ asyncMode: false, readonly: true });

      await waitFor(() => {
        expect(
          screen.getByRole('combobox', { name: /poll frequency/i })
        ).toBeDisabled();
      });
    });

    it('should disable fields when readonly is true in async mode', async () => {
      renderComponent({ asyncMode: true, readonly: true });

      await waitFor(() => {
        expect(
          screen.getByRole('combobox', { name: /ping interval/i })
        ).toBeDisabled();
      });

      expect(
        screen.getByRole('combobox', { name: /snapshot interval/i })
      ).toBeDisabled();
      expect(
        screen.getByRole('combobox', { name: /command interval/i })
      ).toBeDisabled();
    });
  });

  describe('custom title', () => {
    it('should render with custom title', async () => {
      renderComponent({ asyncMode: false, title: 'Custom Title' });

      await waitFor(() => {
        expect(screen.getByText('Custom Title')).toBeVisible();
      });
    });

    it('should render with default title when not specified', async () => {
      renderComponent({ asyncMode: false });

      await waitFor(() => {
        expect(screen.getByText('Check-in Intervals')).toBeVisible();
      });
    });
  });
});

function renderComponent(
  props: Partial<ComponentProps<typeof EdgeIntervalsFieldset>> = {}
) {
  const defaultProps: ComponentProps<typeof EdgeIntervalsFieldset> = {
    value: getDefaultEdgeIntervalsValues(),
    onChange: vi.fn(),
    asyncMode: false,
    ...props,
  };

  const Wrapped = withTestQueryProvider(EdgeIntervalsFieldset);

  return render(<Wrapped {...defaultProps} />);
}
