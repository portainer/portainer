import { useQuery } from 'react-query';

import {getDevices} from "@/portainer/hostmanagement/open-amt/open-amt.service";
import {EnvironmentId} from '@/portainer/environments/types';

export function useAMTDevices(environmentId: EnvironmentId) {
    const { isLoading, isRefetching, data, error } = useQuery(
        ['amt_devices', environmentId],
        async () => getDevices(environmentId),
        {
            refetchOnWindowFocus: false,
        },
    );

    return {
        isLoading: isLoading || isRefetching,
        devices: data,
        error,
    };
}