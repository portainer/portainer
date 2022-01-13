import { Button } from '@/portainer/components/Button';
import { Profile } from "@/portainer/hostmanagement/fdo/model";

interface Props {
    selectedItems: Profile[];
    isFDOEnabled: boolean;
}

export function FDOProfilesDatatableActions({
    selectedItems,
    isFDOEnabled,
}: Props) {
    // const router = useRouter();

    return (
        <div className="actionBar">
            <Button
                disabled={!isFDOEnabled}
                onClick={() => {}}>
                <i className="fa fa-plus-circle space-right" aria-hidden="true" />
                Add New
            </Button>

            <Button
                disabled={!isFDOEnabled}
                onClick={() => {}}>
                <i className="fa fa-plus-circle space-right" aria-hidden="true" />
                Duplicate
            </Button>

            <Button
                disabled={selectedItems.length < 1}
                color="danger"
                onClick={() => {}}
            >
                <i className="fa fa-trash-alt space-right" aria-hidden="true" />
                Remove
            </Button>
        </div>
    );
}
