// lib/core/es-query/__tests__/codegen-java.test.ts

import { describe, it, expect } from 'vitest';
import { parseESQuery } from '../parser';
import { generateJava } from '../codegen/java';

describe('generateJava', () => {
  it('should generate Java client code for match query', () => {
    const json = JSON.stringify({
      query: {
        match: {
          title: 'search',
        },
      },
    });

    const result = parseESQuery(json);
    const java = generateJava(result.root!, { indexName: 'products' });

    expect(java).toContain('SearchRequest');
    expect(java).toContain('.index("products")');
    expect(java).toContain('match');
  });

  it('should generate Java client code for bool query', () => {
    const json = JSON.stringify({
      query: {
        bool: {
          must: [{ match: { title: 'search' } }],
          filter: [{ term: { status: 'active' } }],
        },
      },
    });

    const result = parseESQuery(json);
    const java = generateJava(result.root!, { indexName: 'products' });

    expect(java).toContain('bool');
    expect(java).toContain('must');
    expect(java).toContain('filter');
  });
});
