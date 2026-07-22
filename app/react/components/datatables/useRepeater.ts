import { useEffect, useCallback, useState } from 'react';

export function useRepeater(
  refreshRateMS: number,
  onRefresh?: () => Promise<void> | void
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
    (refreshRateMS) => {
      if (intervalId || !onRefresh) {
        return;
      }

      setIntervalId(
        setInterval(async () => {
          await onRefresh();
        }, refreshRateMS)
      );
    },
    [intervalId, onRefresh]
  );

  useEffect(() => {
    if (!refreshRateMS || !onRefresh) {
      stopRepeater();
    } else {
      startRepeater(refreshRateMS);
    }

    return stopRepeater;
  }, [refreshRateMS, startRepeater, stopRepeater, intervalId, onRefresh]);
}
