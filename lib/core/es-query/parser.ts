// lib/core/es-query/parser.ts

import { v4 as uuidv4 } from 'uuid';
import { ESNode, ESNodeType, ParseResult } from './types';

const CLAUSE_TYPES: Record<string, ESNodeType> = {
  bool: 'bool',
  must: 'must',
  should: 'should',
  must_not: 'must_not',
  filter: 'filter',
  match: 'match',
  match_phrase: 'match_phrase',
  multi_match: 'multi_match',
  term: 'term',
  terms: 'terms',
  range: 'range',
  exists: 'exists',
  nested: 'nested',
  script_score: 'script_score',
  knn: 'knn',
  dis_max: 'dis_max',
  constant_score: 'constant_score',
  match_none: 'match_none',
};

const AGG_TYPES: Record<string, ESNodeType> = {
  terms: 'agg_terms',
  histogram: 'agg_histogram',
  date_histogram: 'agg_date_histogram',
  avg: 'agg_avg',
  sum: 'agg_sum',
  cardinality: 'agg_cardinality',
};

function shouldCollapse(value: unknown): boolean {
  if (
    Array.isArray(value) &&
    value.length > 10 &&
    typeof value[0] === 'number'
  ) {
    return true; // Embedding vectors
  }
  return false;
}

function createNode(
  type: ESNodeType,
  raw: unknown,
  path: string[],
  options: {
    field?: string;
    name?: string;
    params?: Record<string, unknown>;
  } = {}
): ESNode {
  return {
    id: uuidv4(),
    type,
    field: options.field,
    name: options.name,
    params: options.params || {},
    children: [],
    raw,
    meta: {
      collapsed: shouldCollapse(raw),
      path,
    },
  };
}

function parseQueryClause(key: string, value: unknown, path: string[]): ESNode {
  const clausePath = [...path, key];

  // Bool query
  if (key === 'bool' && typeof value === 'object' && value !== null) {
    const node = createNode('bool', value, clausePath);
    const boolObj = value as Record<string, unknown>;

    for (const boolKey of ['must', 'should', 'must_not', 'filter']) {
      if (boolObj[boolKey]) {
        const clauseNode = createNode(
          CLAUSE_TYPES[boolKey] || 'unknown',
          boolObj[boolKey],
          [...clausePath, boolKey]
        );

        const clauses = Array.isArray(boolObj[boolKey])
          ? boolObj[boolKey]
          : [boolObj[boolKey]];

        (clauses as unknown[]).forEach((clause, i) => {
          if (typeof clause === 'object' && clause !== null) {
            Object.entries(clause as Record<string, unknown>).forEach(
              ([k, v]) => {
                clauseNode.children.push(
                  parseQueryClause(k, v, [...clausePath, boolKey, String(i)])
                );
              }
            );
          }
        });

        node.children.push(clauseNode);
      }
    }

    return node;
  }

  // Exists query - special case (no field name pattern)
  if (key === 'exists' && typeof value === 'object' && value !== null) {
    const valueObj = value as Record<string, unknown>;
    return createNode('exists', value, clausePath, {
      params: valueObj,
    });
  }

  // script_score query - wraps another query with custom scoring
  if (key === 'script_score' && typeof value === 'object' && value !== null) {
    const scoreObj = value as Record<string, unknown>;
    const node = createNode('script_score', value, clausePath, {
      params: {
        min_score: scoreObj.min_score,
        script: scoreObj.script,
      },
    });

    // Parse the inner query
    if (scoreObj.query && typeof scoreObj.query === 'object') {
      const innerQuery = scoreObj.query as Record<string, unknown>;
      for (const [k, v] of Object.entries(innerQuery)) {
        node.children.push(parseQueryClause(k, v, [...clausePath, 'query']));
      }
    }

    return node;
  }

  // knn query - k-nearest neighbors for vector search
  if (key === 'knn' && typeof value === 'object' && value !== null) {
    const knnObj = value as Record<string, unknown>;
    const node = createNode('knn', value, clausePath, {
      field: knnObj.field as string | undefined,
      params: {
        k: knnObj.k,
        num_candidates: knnObj.num_candidates,
        boost: knnObj.boost,
        similarity: knnObj.similarity,
        _name: knnObj._name,
        query_vector: knnObj.query_vector,
      },
    });

    // Parse filters inside knn
    if (knnObj.filter) {
      const filterNode = createNode('filter', knnObj.filter, [
        ...clausePath,
        'filter',
      ]);

      const filters = Array.isArray(knnObj.filter)
        ? knnObj.filter
        : [knnObj.filter];

      (filters as unknown[]).forEach((f, i) => {
        if (typeof f === 'object' && f !== null) {
          Object.entries(f as Record<string, unknown>).forEach(([k, v]) => {
            filterNode.children.push(
              parseQueryClause(k, v, [...clausePath, 'filter', String(i)])
            );
          });
        }
      });

      node.children.push(filterNode);
    }

    return node;
  }

  // dis_max query - disjunction max
  if (key === 'dis_max' && typeof value === 'object' && value !== null) {
    const disMaxObj = value as Record<string, unknown>;
    const node = createNode('dis_max', value, clausePath, {
      params: {
        boost: disMaxObj.boost,
        tie_breaker: disMaxObj.tie_breaker,
        _name: disMaxObj._name,
      },
    });

    // Parse the queries array
    if (disMaxObj.queries && Array.isArray(disMaxObj.queries)) {
      (disMaxObj.queries as unknown[]).forEach((query, i) => {
        if (typeof query === 'object' && query !== null) {
          Object.entries(query as Record<string, unknown>).forEach(([k, v]) => {
            node.children.push(
              parseQueryClause(k, v, [...clausePath, 'queries', String(i)])
            );
          });
        }
      });
    }

    return node;
  }

  // constant_score query - wraps a filter with constant boost
  if (key === 'constant_score' && typeof value === 'object' && value !== null) {
    const constObj = value as Record<string, unknown>;
    const node = createNode('constant_score', value, clausePath, {
      params: {
        boost: constObj.boost,
        _name: constObj._name,
      },
    });

    // Parse the filter
    if (constObj.filter && typeof constObj.filter === 'object') {
      const filterQuery = constObj.filter as Record<string, unknown>;
      for (const [k, v] of Object.entries(filterQuery)) {
        node.children.push(
          parseQueryClause(k, v, [...clausePath, 'filter'])
        );
      }
    }

    return node;
  }

  // match_none - matches no documents
  if (key === 'match_none') {
    return createNode('match_none', value, clausePath);
  }

  // multi_match query - search across multiple fields
  if (key === 'multi_match' && typeof value === 'object' && value !== null) {
    const mmObj = value as Record<string, unknown>;
    return createNode('multi_match', value, clausePath, {
      params: mmObj,
    });
  }

  // Match, term, etc. - field-level queries
  if (CLAUSE_TYPES[key] && typeof value === 'object' && value !== null) {
    const valueObj = value as Record<string, unknown>;
    const fieldName = Object.keys(valueObj)[0];
    const fieldValue = valueObj[fieldName];

    const params: Record<string, unknown> =
      typeof fieldValue === 'object' && fieldValue !== null
        ? (fieldValue as Record<string, unknown>)
        : { value: fieldValue };

    return createNode(CLAUSE_TYPES[key], value, clausePath, {
      field: fieldName,
      params,
    });
  }

  // Unknown clause
  return createNode('unknown', value, clausePath, {
    params:
      typeof value === 'object' ? (value as Record<string, unknown>) : { value },
  });
}

function parseAggregations(
  aggs: Record<string, unknown>,
  path: string[]
): ESNode[] {
  const nodes: ESNode[] = [];

  for (const [aggName, aggDef] of Object.entries(aggs)) {
    if (typeof aggDef !== 'object' || aggDef === null) continue;

    const aggObj = aggDef as Record<string, unknown>;
    const aggPath = [...path, aggName];

    // Find the aggregation type
    for (const [aggType, typeMapping] of Object.entries(AGG_TYPES)) {
      if (aggObj[aggType]) {
        const aggConfig = aggObj[aggType] as Record<string, unknown>;
        const node = createNode(typeMapping, aggDef, aggPath, {
          name: aggName,
          field: aggConfig.field as string | undefined,
          params: aggConfig,
        });

        // Handle nested aggregations
        if (aggObj.aggs || aggObj.aggregations) {
          const nestedAggs = (aggObj.aggs || aggObj.aggregations) as Record<
            string,
            unknown
          >;
          node.children.push(
            ...parseAggregations(nestedAggs, [...aggPath, 'aggs'])
          );
        }

        nodes.push(node);
        break;
      }
    }
  }

  return nodes;
}

export function parseESQuery(json: string): ParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return {
      success: false,
      error: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`,
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      success: false,
      error: 'Expected an object at root level',
    };
  }

  const root = createNode('query', parsed, []);
  const obj = parsed as Record<string, unknown>;

  // Parse query
  if (obj.query && typeof obj.query === 'object') {
    const queryObj = obj.query as Record<string, unknown>;
    for (const [key, value] of Object.entries(queryObj)) {
      root.children.push(parseQueryClause(key, value, ['query']));
    }
  }

  // Parse aggregations
  const aggs = obj.aggs || obj.aggregations;
  if (aggs && typeof aggs === 'object') {
    const aggsNode = createNode('aggs', aggs, ['aggs']);
    aggsNode.children.push(
      ...parseAggregations(aggs as Record<string, unknown>, ['aggs'])
    );
    root.children.push(aggsNode);
  }

  // Parse size, from, sort, _source
  if (typeof obj.size === 'number') {
    root.children.push(
      createNode('size', obj.size, ['size'], { params: { value: obj.size } })
    );
  }
  if (typeof obj.from === 'number') {
    root.children.push(
      createNode('from', obj.from, ['from'], { params: { value: obj.from } })
    );
  }
  if (obj.sort) {
    root.children.push(
      createNode('sort', obj.sort, ['sort'], { params: { value: obj.sort } })
    );
  }
  if (obj._source !== undefined) {
    root.children.push(
      createNode('source', obj._source, ['_source'], {
        params: { value: obj._source },
      })
    );
  }

  return {
    success: true,
    root,
  };
}
