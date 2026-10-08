export type Stage = 1 | 2 | 3 | 4 | 5;
export type Source = { scar: string } | { standard: string };

export interface Item {
  id: string;
  stage: Stage;
  check: string;
  why: string;
  sources: Source[];
  probe?: string;
}

export interface ClassDef {
  id: string;
  title: string;
  summary: string;
  items: Item[];
}

export interface Standard {
  id: string;
  name: string;
  url: string;
  version: string;
  checked: string;
}

export interface Catalog {
  classes: ClassDef[];
  standards: Standard[];
  /** scar id → title (first `# ` heading of scars/<id>.md) */
  scars: Record<string, string>;
}
