import { renderHook } from '@testing-library/react-hooks';

import { useAggregatedMetrics } from './useAggregatedMetrics';

const point = {
  cpu: '500m',
  memory: '128Mi',
  timestamp: '2024-01-01T00:00:01Z',
};

type Props = { data: typeof point | undefined; error: unknown };

function renderMetrics(initialProps: Props, nodeCPU = 4) {
  return renderHook((props: Props) => useAggregatedMetrics(props, nodeCPU), {
    initialProps,
  });
}

describe('useAggregatedMetrics', () => {
  it('stays checking until this mount reports a result', () => {
    const { result } = renderMetrics({ data: undefined, error: undefined });

    expect(result.current.metricsState).toBe('checking');
    expect(result.current.chartData).toHaveLength(0);
  });

  it('does not latch on cached data from a previous mount while still checking', () => {
    const { result, rerender } = renderMetrics({
      data: point,
      error: undefined,
    });

    expect(result.current.metricsState).toBe('checking');

    rerender({ data: undefined, error: new Error('metrics unavailable') });

    expect(result.current.metricsState).toBe('unavailable');
  });

  it('marks metrics available once this mount fetches successfully', () => {
    const { result, rerender } = renderMetrics({
      data: undefined,
      error: undefined,
    });

    rerender({ data: point, error: null });

    expect(result.current.metricsState).toBe('available');
    expect(result.current.chartData).toHaveLength(1);
  });

  it('marks metrics available even when a successful poll produces no chart point', () => {
    const { result, rerender } = renderMetrics({
      data: undefined,
      error: undefined,
    });

    // e.g. usePodMetricsQuery's select returns undefined when the target container is momentarily absent from an otherwise-successful response
    rerender({ data: undefined, error: null });

    expect(result.current.metricsState).toBe('available');
    expect(result.current.chartData).toHaveLength(0);
  });

  it('latches state so a later failure does not flip it back to unavailable', () => {
    const { result, rerender } = renderMetrics({ data: point, error: null });

    expect(result.current.metricsState).toBe('available');

    rerender({ data: undefined, error: new Error('transient failure') });

    expect(result.current.metricsState).toBe('available');
  });

  it('resets chart data when nodeCPU changes', () => {
    type NodeCpuProps = { nodeCPU: number; data: typeof point | undefined };

    const { result, rerender } = renderHook(
      (props: NodeCpuProps) =>
        useAggregatedMetrics({ data: props.data, error: null }, props.nodeCPU),
      { initialProps: { nodeCPU: 4, data: point } as NodeCpuProps }
    );

    expect(result.current.chartData).toHaveLength(1);

    rerender({ nodeCPU: 8, data: undefined });

    expect(result.current.chartData).toHaveLength(0);
  });
});
