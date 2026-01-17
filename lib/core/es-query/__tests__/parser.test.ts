// lib/core/es-query/__tests__/parser.test.ts

import { describe, it, expect } from 'vitest';
import { parseESQuery } from '../parser';

describe('parseESQuery', () => {
  it('should parse a simple match query', () => {
    const json = JSON.stringify({
      query: {
        match: {
          title: 'search term',
        },
      },
    });

    const result = parseESQuery(json);

    expect(result.success).toBe(true);
    expect(result.root).toBeDefined();
    expect(result.root?.type).toBe('query');
    expect(result.root?.children).toHaveLength(1);
    expect(result.root?.children[0].type).toBe('match');
    expect(result.root?.children[0].field).toBe('title');
  });

  it('should return error for invalid JSON', () => {
    const result = parseESQuery('{ invalid json }');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should parse bool query with must/should/filter', () => {
    const json = JSON.stringify({
      query: {
        bool: {
          must: [{ match: { title: 'search' } }],
          should: [{ match: { description: 'optional' } }],
          filter: [{ term: { status: 'active' } }],
        },
      },
    });

    const result = parseESQuery(json);

    expect(result.success).toBe(true);
    const boolNode = result.root?.children[0];
    expect(boolNode?.type).toBe('bool');
    expect(boolNode?.children).toHaveLength(3);
  });

  it('should parse range query', () => {
    const json = JSON.stringify({
      query: {
        range: {
          price: {
            gte: 10,
            lte: 100,
          },
        },
      },
    });

    const result = parseESQuery(json);

    expect(result.success).toBe(true);
    const rangeNode = result.root?.children[0];
    expect(rangeNode?.type).toBe('range');
    expect(rangeNode?.field).toBe('price');
    expect(rangeNode?.params.gte).toBe(10);
    expect(rangeNode?.params.lte).toBe(100);
  });

  it('should parse exists query', () => {
    const json = JSON.stringify({
      query: {
        exists: {
          field: 'user',
        },
      },
    });

    const result = parseESQuery(json);

    expect(result.success).toBe(true);
    const existsNode = result.root?.children[0];
    expect(existsNode?.type).toBe('exists');
    expect(existsNode?.params.field).toBe('user');
  });

  it('should parse terms aggregation', () => {
    const json = JSON.stringify({
      aggs: {
        categories: {
          terms: {
            field: 'category',
            size: 10,
          },
        },
      },
    });

    const result = parseESQuery(json);

    expect(result.success).toBe(true);
    const aggsNode = result.root?.children.find((c) => c.type === 'aggs');
    expect(aggsNode).toBeDefined();
    expect(aggsNode?.children).toHaveLength(1);
    expect(aggsNode?.children[0].type).toBe('agg_terms');
    expect(aggsNode?.children[0].name).toBe('categories');
    expect(aggsNode?.children[0].field).toBe('category');
  });

  it('should parse nested aggregations', () => {
    const json = JSON.stringify({
      aggs: {
        categories: {
          terms: {
            field: 'category',
          },
          aggs: {
            avg_price: {
              avg: {
                field: 'price',
              },
            },
          },
        },
      },
    });

    const result = parseESQuery(json);

    expect(result.success).toBe(true);
    const aggsNode = result.root?.children.find((c) => c.type === 'aggs');
    const termsAgg = aggsNode?.children[0];
    expect(termsAgg?.children).toHaveLength(1);
    expect(termsAgg?.children[0].type).toBe('agg_avg');
    expect(termsAgg?.children[0].name).toBe('avg_price');
  });
});
