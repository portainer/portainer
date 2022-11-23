interface Props {
  running: number;
  stopped: number;
}

export function RunningStatus({ running, stopped }: Props) {
  return (
    <div>
      <div>
        <i
          className="fa fa-power-off green-icon space-right"
          aria-hidden="true"
        />
        {`${running || '-'} running`}
      </div>
      <div>
        <i
          className="fa fa-power-off red-icon space-right"
          aria-hidden="true"
        />
        {`${stopped || '-'} stopped`}
      </div>
    </div>
  );
}
