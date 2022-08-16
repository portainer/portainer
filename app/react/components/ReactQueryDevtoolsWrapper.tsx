import { ReactQueryDevtools } from 'react-query/devtools';

export function ReactQueryDevtoolsWrapper() {
  const showReactQueryDevtools =
    process.env.SHOW_REACT_QUERY_DEV_TOOLS === 'true';

  return <>{showReactQueryDevtools && <ReactQueryDevtools />}</>;
}
