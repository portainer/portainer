import { useRouter } from '@uirouter/react';
import { useEffect } from 'react';

export function Redirect({ to, params = {} }: { to: string; params?: object }) {
  const router = useRouter();
  useEffect(() => {
    router.stateService.go(to, params);
  }, [params, router.stateService, to]);
  return null;
}
