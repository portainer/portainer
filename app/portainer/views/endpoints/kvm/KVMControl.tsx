// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {KVM} from "@open-amt-cloud-toolkit/ui-toolkit-react/reactjs/src/kvm.bundle";

import { react2angular } from '@/react-tools/react2angular';

export interface KVMControlProps {
    deviceId: string;
    server: string;
    token: string;
}

export function KVMControl({deviceId, server, token}: KVMControlProps) {

    if (!deviceId || !server || !token) return (
        <div>Loading...</div>
    )

    return (
        <div>
            {deviceId}
            <KVM
                deviceId={deviceId}
                mpsServer="https://198.199.100.44/mps/ws/relay"
                authToken="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IiIsImlzcyI6IjlFbVJKVGJJaUliNGJJZVNzbWdjV0lqclI2SHlFVHFjIiwiZXhwIjoxNjM4MzY1ODk5fQ.a1cnReN1LpE8Af3Zw-PXo-QQla7y9Vvh0isCzr2d4_0"
                mouseDebounceTime="200"
                canvasHeight="100%"
                canvasWidth="100%"
            />
        </div>
    );
}

export const KVMControlAngular = react2angular(KVMControl, ['deviceId']);