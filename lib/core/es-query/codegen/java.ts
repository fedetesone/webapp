// lib/core/es-query/codegen/java.ts

import { ESNode, CodeGenOptions } from '../types';

function indent(level: number): string {
  return '    '.repeat(level);
}

function generateQueryBuilder(query: unknown, level: number = 2): string {
  if (typeof query !== 'object' || query === null) {
    return `"${query}"`;
  }

  const obj = query as Record<string, unknown>;
  const keys = Object.keys(obj);

  if (keys.length === 0) return 'matchAll()';

  const key = keys[0];
  const value = obj[key];

  switch (key) {
    case 'match': {
      const matchObj = value as Record<string, unknown>;
      const field = Object.keys(matchObj)[0];
      const matchValue = matchObj[field];
      const queryValue =
        typeof matchValue === 'object'
          ? (matchValue as Record<string, unknown>).query
          : matchValue;
      return `match(m -> m.field("${field}").query("${queryValue}"))`;
    }

    case 'term': {
      const termObj = value as Record<string, unknown>;
      const field = Object.keys(termObj)[0];
      const termValue = termObj[field];
      const actualValue =
        typeof termValue === 'object'
          ? (termValue as Record<string, unknown>).value
          : termValue;
      return `term(t -> t.field("${field}").value("${actualValue}"))`;
    }

    case 'range': {
      const rangeObj = value as Record<string, unknown>;
      const field = Object.keys(rangeObj)[0];
      const rangeParams = rangeObj[field] as Record<string, unknown>;
      const parts: string[] = [`field("${field}")`];
      if (rangeParams.gte !== undefined)
        parts.push(`gte(JsonData.of(${rangeParams.gte}))`);
      if (rangeParams.gt !== undefined)
        parts.push(`gt(JsonData.of(${rangeParams.gt}))`);
      if (rangeParams.lte !== undefined)
        parts.push(`lte(JsonData.of(${rangeParams.lte}))`);
      if (rangeParams.lt !== undefined)
        parts.push(`lt(JsonData.of(${rangeParams.lt}))`);
      return `range(r -> r.${parts.join('.')})`;
    }

    case 'bool': {
      const boolObj = value as Record<string, unknown>;
      const parts: string[] = [];

      if (boolObj.must) {
        const musts = Array.isArray(boolObj.must) ? boolObj.must : [boolObj.must];
        musts.forEach((m) => {
          parts.push(
            `${indent(level + 1)}.must(q -> q.${generateQueryBuilder(m, level + 2)})`
          );
        });
      }

      if (boolObj.should) {
        const shoulds = Array.isArray(boolObj.should)
          ? boolObj.should
          : [boolObj.should];
        shoulds.forEach((s) => {
          parts.push(
            `${indent(level + 1)}.should(q -> q.${generateQueryBuilder(s, level + 2)})`
          );
        });
      }

      if (boolObj.filter) {
        const filters = Array.isArray(boolObj.filter)
          ? boolObj.filter
          : [boolObj.filter];
        filters.forEach((f) => {
          parts.push(
            `${indent(level + 1)}.filter(q -> q.${generateQueryBuilder(f, level + 2)})`
          );
        });
      }

      if (boolObj.must_not) {
        const mustNots = Array.isArray(boolObj.must_not)
          ? boolObj.must_not
          : [boolObj.must_not];
        mustNots.forEach((mn) => {
          parts.push(
            `${indent(level + 1)}.mustNot(q -> q.${generateQueryBuilder(mn, level + 2)})`
          );
        });
      }

      return `bool(b -> b\n${parts.join('\n')}\n${indent(level)})`;
    }

    case 'exists': {
      const existsObj = value as Record<string, unknown>;
      return `exists(e -> e.field("${existsObj.field}"))`;
    }

    default:
      return `// TODO: Implement ${key} query type`;
  }
}

export function generateJava(
  root: ESNode,
  options: CodeGenOptions = {}
): string {
  const index = options.indexName || 'INDEX_NAME';
  const raw = root.raw as Record<string, unknown>;

  const lines: string[] = [];

  lines.push('import co.elastic.clients.elasticsearch.ElasticsearchClient;');
  lines.push('import co.elastic.clients.elasticsearch.core.SearchRequest;');
  lines.push('import co.elastic.clients.elasticsearch.core.SearchResponse;');
  lines.push('import co.elastic.clients.json.JsonData;');
  lines.push('');

  lines.push('SearchRequest request = SearchRequest.of(s -> s');
  lines.push(`    .index("${index}")`);

  if (raw.query) {
    const queryCode = generateQueryBuilder(raw.query, 2);
    lines.push(`    .query(q -> q.${queryCode})`);
  }

  if (raw.size !== undefined) {
    lines.push(`    .size(${raw.size})`);
  }

  if (raw.from !== undefined) {
    lines.push(`    .from(${raw.from})`);
  }

  lines.push(');');
  lines.push('');
  lines.push(
    'SearchResponse<Object> response = client.search(request, Object.class);'
  );

  return lines.join('\n');
}
