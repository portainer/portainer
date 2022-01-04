import { useEffect, useCallback, useState } from 'react';

export function useRepeater(
  refreshRate: number,
  onRefresh: () => Promise<void>
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
      if (intervalId) {
        return;
      }

      setIntervalId(
        setInterval(async () => {
          await onRefresh();
        }, refreshRate * 1000)
      );
    },
    [intervalId]
  );

  useEffect(() => {
    if (!refreshRate) {
      stopRepeater();
    } else {
      startRepeater(refreshRate);
    }

    return stopRepeater;
  }, [refreshRate, startRepeater, stopRepeater, intervalId]);
}
