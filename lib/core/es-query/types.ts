// lib/core/es-query/types.ts

export type ESNodeType =
  | 'query'
  | 'bool'
  | 'must'
  | 'should'
  | 'must_not'
  | 'filter'
  | 'match'
  | 'match_phrase'
  | 'multi_match'
  | 'term'
  | 'terms'
  | 'range'
  | 'exists'
  | 'nested'
  | 'aggs'
  | 'agg_terms'
  | 'agg_histogram'
  | 'agg_date_histogram'
  | 'agg_avg'
  | 'agg_sum'
  | 'agg_cardinality'
  | 'sort'
  | 'source'
  | 'size'
  | 'from'
  | 'unknown';

export interface ESNode {
  id: string;
  type: ESNodeType;
  name?: string; // For named clauses like aggregations
  field?: string;
  params: Record<string, unknown>;
  children: ESNode[];
  raw: unknown;
  meta: {
    collapsed: boolean;
    warning?: string;
    path: string[];
  };
}

export interface ParseResult {
  success: boolean;
  root?: ESNode;
  error?: string;
  index?: string; // Extracted index name if present
}

export interface CodeGenOptions {
  indexName?: string;
  host?: string;
  includeAuth?: boolean;
  prettyPrint?: boolean;
}
