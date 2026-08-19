import { DetailsTable } from '@@/DetailsTable';

interface LabelsRowProps {
  labels?: Record<string, string>;
}

export function LabelsRow({ labels }: LabelsRowProps) {
  if (!labels || Object.keys(labels).length === 0) {
    return null;
  }

  return (
    <DetailsTable.Row label="Labels">
      <table className="table-bordered table-condensed !m-0 table">
        <tbody>
          {Object.entries(labels).map(([key, value]) => (
            <tr key={key}>
              <td>{key}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DetailsTable.Row>
  );
}
