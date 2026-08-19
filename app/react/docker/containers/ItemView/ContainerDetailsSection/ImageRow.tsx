import { DetailsTable } from '@@/DetailsTable';
import { Link } from '@@/Link';

interface ImageRowProps {
  image: string;
  imageHash: string;
  nodeName?: string;
}

export function ImageRow({ image, imageHash, nodeName }: ImageRowProps) {
  return (
    <DetailsTable.Row label="Image">
      <Link
        data-cy="container-image-link"
        to="docker.images.image"
        params={{ id: image, nodeName }}
      >
        {image}@{imageHash}
      </Link>
    </DetailsTable.Row>
  );
}
