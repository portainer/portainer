import { render, screen } from '@testing-library/react';

import {
  ContainerStats,
  CPUStats,
  GpuStats,
  MemoryStats,
  NodeStats,
} from './StatsItem';

describe('StatsItem', () => {
  describe('NodeStats', () => {
    it('renders node count with NODES label', () => {
      render(<NodeStats value={3} />);
      expect(screen.getByText('3')).toBeVisible();
      expect(screen.getByText('NODES')).toBeVisible();
    });
  });

  describe('CPUStats', () => {
    it('renders CPU count with cores label', () => {
      render(<CPUStats value={8} />);
      expect(screen.getByText('8')).toBeVisible();
      expect(screen.getByText('cores')).toBeVisible();
    });
  });

  describe('MemoryStats', () => {
    it('renders memory value with MEMORY label', () => {
      render(<MemoryStats value="8 GB" />);
      expect(screen.getByText('8 GB')).toBeVisible();
      expect(screen.getByText('MEMORY')).toBeVisible();
    });
  });

  describe('GpuStats', () => {
    it('renders GPU count with GPUS label', () => {
      render(<GpuStats value={4} />);
      expect(screen.getByText('4')).toBeVisible();
      expect(screen.getByText('GPUS')).toBeVisible();
    });
  });

  describe('ContainerStats', () => {
    it('renders running/total containers with a progress bar', () => {
      render(<ContainerStats total={5} running={3} stopped={2} />);
      expect(screen.getByText('3')).toBeVisible();
      expect(screen.getByText('/ 5')).toBeVisible();
      expect(screen.getByRole('progressbar')).toBeVisible();
    });

    it('renders a progress bar when total is zero', () => {
      render(<ContainerStats total={0} running={0} stopped={0} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
});
