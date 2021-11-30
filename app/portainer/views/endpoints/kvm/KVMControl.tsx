// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {KVM} from "@open-amt-cloud-toolkit/ui-toolkit-react/reactjs/src/kvm.bundle";
import {useEffect, useState} from "react";

import {react2angular} from '@/react-tools/react2angular';

export interface KVMControlProps {
    deviceId: string;
}

export function KVMControl({deviceId}: KVMControlProps) {

    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // TODO fetch MPS Server and Token from new endpoint
        setIsLoading(false);
    }, []);

    if (isLoading) return (
        <div>Loading...{deviceId}</div>
    )

    return (
        <div>
            {deviceId}
            <KVM
                deviceId={deviceId}
                mpsServer="https://198.199.100.44/mps/ws/relay"
                authToken="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IiIsImlzcyI6IjlFbVJKVGJJaUliNGJJZVNzbWdjV0lqclI2SHlFVHFjIiwiZXhwIjoxNjM4MzEwNTAwfQ.U8tf61V1dZiJXj69dJLkArioRPcs9sq0i--tVrdg6Ew"
                mouseDebounceTime="200"
                canvasHeight="100%"
                canvasWidth="100%"
            />
        </div>
    );
}

export const KVMControlAngular = react2angular(KVMControl, ['deviceId']);