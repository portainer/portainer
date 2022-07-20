import { useEffect, useCallback, useState } from 'react';

export function useRepeater(
  refreshRate: number,
  onRefresh?: () => Promise<void>
) {
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const stopRepeater = useCallback(() => {
    if (!intervalId) {
      return;
    }

    clearInterval(intervalId);
    setIntervalId(null);
  }, [intervalId]);

  const startRepeater = useCallback(
    (refreshRate) => {
      if (intervalId || !onRefresh) {
        return;
      }

      setIntervalId(
        setInterval(async () => {
          await onRefresh();
        }, refreshRate * 1000)
      );
    },
    [intervalId, onRefresh]
  );

  useEffect(() => {
    if (!refreshRate || !onRefresh) {
      stopRepeater();
    } else {
      startRepeater(refreshRate);
    }

    return stopRepeater;
  }, [refreshRate, startRepeater, stopRepeater, intervalId, onRefresh]);
}
