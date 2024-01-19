export type Placement = {
  label: string;
  value: string;
  needsDeletion?: boolean;
};

export type PlacementType = 'mandatory' | 'preferred';

export type PlacementsFormValues = {
  placementType: PlacementType;
  placements: Placement[];
};

export type NodeLabels = Record<string, string[]>;
