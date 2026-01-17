// lib/core/es-query/__tests__/codegen-python.test.ts

import { describe, it, expect } from 'vitest';
import { parseESQuery } from '../parser';
import { generatePython } from '../codegen/python';

describe('generatePython', () => {
  it('should generate elasticsearch-py code', () => {
    const json = JSON.stringify({
      query: {
        match: {
          title: 'search',
        },
      },
    });

    const result = parseESQuery(json);
    const python = generatePython(result.root!, { indexName: 'products' });

    expect(python).toContain('client.search');
    expect(python).toContain('index="products"');
    expect(python).toContain('match');
  });
});
