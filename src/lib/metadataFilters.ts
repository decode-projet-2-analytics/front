export type FilterOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "exists";

export interface MetadataFilter {
  key: string;
  op: FilterOp;
  value?: string | number | boolean;
}

export interface WidgetSeries {
  name: string;
  filters: MetadataFilter[];
}
