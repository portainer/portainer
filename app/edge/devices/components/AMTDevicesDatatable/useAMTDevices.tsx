import { useQuery } from 'react-query';

import {getDevices} from "@/portainer/hostmanagement/open-amt/open-amt.service";
import {EnvironmentId} from '@/portainer/environments/types';

export function useAMTDevices(environmentId: EnvironmentId) {
    const { isLoading, isRefetching, data, isError, error, status } = useQuery(
        ['amt_devices', environmentId],
        async () => getDevices(environmentId),
        {
            refetchOnMount: 'always',
            optimisticResults: false,
        },
    );

    // TODO mrydel isError/error is not working (always false/null)
    console.log(`isError: ${isError}`);
    console.log(`isLoading: ${isLoading}`);
    console.log(`isRefetching: ${isRefetching}`);
    console.log(`data: ${data}`);
    console.log(`status: ${status}`);

    return {
        isLoading: isLoading || isRefetching,
        devices: data,
        error,
    };
}