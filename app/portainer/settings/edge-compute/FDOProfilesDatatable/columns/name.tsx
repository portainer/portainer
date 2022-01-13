import { CellProps, Column } from 'react-table';
import { useSref } from '@uirouter/react';

import { Profile } from "@/portainer/hostmanagement/fdo/model";

export const name: Column<Profile> = {
    Header: 'Name',
    accessor: 'name',
    id: 'name',
    Cell: NameCell,
    disableFilters: true,
    Filter: () => null,
    canHide: true,
    sortType: 'string',
};

export function NameCell({
         value: name,
         row: { original: profile },
     }: CellProps<Profile>) {

    // TODO mrydel
    const linkProps = useSref('docker.containers.container', {
        id: profile.id,
    });

    return (
        <a href={linkProps.href} onClick={linkProps.onClick} title={name}>
            {name}
        </a>
    );
}
