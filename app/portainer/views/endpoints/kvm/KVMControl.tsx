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
        setIsLoading(false);
    }, []);

    if (isLoading) return (
        <div>Loading...</div>
    )

    return (
        <div>
            {deviceId}
            <KVM
                deviceId={deviceId}
                mpsServer="https://198.199.100.44/mps/ws/relay"
                authToken="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IiIsImlzcyI6IjlFbVJKVGJJaUliNGJJZVNzbWdjV0lqclI2SHlFVHFjIiwiZXhwIjoxNjM4MzAyMjM3fQ.ZI8fqaV7HRb1ofY4iTH5T6mhBY4B-9mg26lla6k1H0k"
                mouseDebounceTime="200"
                canvasHeight="100%"
                canvasWidth="100%"
            />
        </div>
    );
}

export const KVMControlAngular = react2angular(KVMControl, ['deviceId']);
