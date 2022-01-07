import { useQuery } from 'react-query';

import {getDevices} from "@/portainer/hostmanagement/open-amt/open-amt.service";
import {EnvironmentId} from '@/portainer/environments/types';

export function useAMTDevices(environmentId: EnvironmentId) {
    console.log("useAMTDevices");

    const { isLoading, data, isError, error } = useQuery(
        ['amt_devices', environmentId],
        async () => getDevices(environmentId),
        {
            keepPreviousData: true,
            refetchInterval: () => false,
        }
    );

    // TODO mrydel isError/error is not working (always false/null)
    console.log(`isError: ${isError}`);

    return {
        isLoading,
        devices: data,
        error,
    };
}