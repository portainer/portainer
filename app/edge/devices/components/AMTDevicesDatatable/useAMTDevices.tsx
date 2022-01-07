import { useQuery } from 'react-query';

import {getDevices} from "@/portainer/hostmanagement/open-amt/open-amt.service";
import {EnvironmentId} from '@/portainer/environments/types';

export function useAMTDevices(environmentId: EnvironmentId) {
    console.log("useAMTDevices");

    const { isLoading, data, error } = useQuery(
        ['amt_devices', environmentId],
        async () => getDevices(environmentId),
        {
            keepPreviousData: true,
            refetchInterval: () => false,
        }
    );

    return {
        isLoading,
        data,
        error,
    };
}