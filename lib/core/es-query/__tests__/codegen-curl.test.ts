// lib/core/es-query/__tests__/codegen-curl.test.ts

import { describe, it, expect } from 'vitest';
import { parseESQuery } from '../parser';
import { generateCurl } from '../codegen/curl';

describe('generateCurl', () => {
  it('should generate basic curl command', () => {
    const json = JSON.stringify({
      query: {
        match: {
          title: 'search',
        },
      },
    });

    const result = parseESQuery(json);
    const curl = generateCurl(result.root!, {
      indexName: 'products',
      host: 'localhost:9200',
    });

    expect(curl).toContain('curl');
    expect(curl).toContain('localhost:9200/products/_search');
    expect(curl).toContain('"match"');
  });

  it('should include auth placeholder when requested', () => {
    const json = JSON.stringify({ query: { match_all: {} } });
    const result = parseESQuery(json);
    const curl = generateCurl(result.root!, {
      indexName: 'test',
      includeAuth: true,
    });

    expect(curl).toContain('-u');
  });
});
