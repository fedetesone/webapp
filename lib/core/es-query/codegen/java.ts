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

    case 'terms': {
      const termsObj = value as Record<string, unknown>;
      const field = Object.keys(termsObj)[0];
      const termsValue = termsObj[field];
      const values = Array.isArray(termsValue) ? termsValue : [termsValue];
      const valueList = values.map((v) => `FieldValue.of("${v}")`).join(', ');
      return `terms(t -> t.field("${field}").terms(tv -> tv.value(List.of(${valueList}))))`;
    }

    case 'match_phrase': {
      const mpObj = value as Record<string, unknown>;
      const field = Object.keys(mpObj)[0];
      const mpValue = mpObj[field];
      const queryValue =
        typeof mpValue === 'object'
          ? (mpValue as Record<string, unknown>).query
          : mpValue;
      return `matchPhrase(mp -> mp.field("${field}").query("${queryValue}"))`;
    }

    case 'multi_match': {
      const mmObj = value as Record<string, unknown>;
      const fields = (mmObj.fields as string[]) || [];
      const query = mmObj.query as string;
      const type = mmObj.type as string | undefined;
      const fieldsList = fields.map((f) => `"${f}"`).join(', ');
      let builder = `multiMatch(mm -> mm.query("${query}").fields(${fieldsList})`;
      if (type) {
        builder += `.type(TextQueryType.${type.replace(/_/g, '').toUpperCase()})`;
      }
      if (mmObj.boost) {
        builder += `.boost(${mmObj.boost}f)`;
      }
      builder += ')';
      return builder;
    }

    case 'match_none': {
      return 'matchNone(mn -> mn)';
    }

    case 'constant_score': {
      const csObj = value as Record<string, unknown>;
      const filter = csObj.filter as Record<string, unknown>;
      const filterCode = generateQueryBuilder(filter, level + 1);
      let builder = `constantScore(cs -> cs.filter(f -> f.${filterCode})`;
      if (csObj.boost) {
        builder += `.boost(${csObj.boost}f)`;
      }
      builder += ')';
      return builder;
    }

    case 'dis_max': {
      const dmObj = value as Record<string, unknown>;
      const queries = dmObj.queries as unknown[];
      const queryParts = queries.map((q) => {
        const qCode = generateQueryBuilder(q, level + 2);
        return `${indent(level + 1)}.queries(q -> q.${qCode})`;
      });
      let builder = `disMax(dm -> dm\n${queryParts.join('\n')}`;
      if (dmObj.tie_breaker !== undefined) {
        builder += `\n${indent(level + 1)}.tieBreaker(${dmObj.tie_breaker})`;
      }
      if (dmObj.boost) {
        builder += `\n${indent(level + 1)}.boost(${dmObj.boost}f)`;
      }
      builder += `\n${indent(level)})`;
      return builder;
    }

    case 'knn': {
      const knnObj = value as Record<string, unknown>;
      const field = knnObj.field as string;
      const k = knnObj.k as number;
      const numCandidates = knnObj.num_candidates as number | undefined;
      const queryVector = knnObj.query_vector as number[];

      let builder = `knn(knn -> knn\n`;
      builder += `${indent(level + 1)}.field("${field}")\n`;
      builder += `${indent(level + 1)}.k(${k})\n`;
      if (numCandidates) {
        builder += `${indent(level + 1)}.numCandidates(${numCandidates})\n`;
      }
      if (queryVector && queryVector.length > 0) {
        // Show truncated vector for readability
        const vectorPreview =
          queryVector.length > 3
            ? `${queryVector.slice(0, 3).join(', ')}f, ... /* ${queryVector.length} values */`
            : queryVector.map((v) => `${v}f`).join(', ');
        builder += `${indent(level + 1)}.queryVector(${vectorPreview})\n`;
      }
      if (knnObj.filter) {
        const filters = Array.isArray(knnObj.filter)
          ? knnObj.filter
          : [knnObj.filter];
        filters.forEach((f) => {
          const filterCode = generateQueryBuilder(f, level + 2);
          builder += `${indent(level + 1)}.filter(f -> f.${filterCode})\n`;
        });
      }
      builder += `${indent(level)})`;
      return builder;
    }

    case 'script_score': {
      const ssObj = value as Record<string, unknown>;
      const query = ssObj.query as Record<string, unknown>;
      const script = ssObj.script as Record<string, unknown> | undefined;
      const minScore = ssObj.min_score as number | undefined;

      const queryCode = generateQueryBuilder(query, level + 2);
      let builder = `functionScore(fs -> fs\n`;
      builder += `${indent(level + 1)}.query(q -> q.${queryCode})\n`;
      if (script) {
        builder += `${indent(level + 1)}.scriptScore(ss -> ss.script(s -> s\n`;
        builder += `${indent(level + 2)}.source("${(script.source as string || '').replace(/"/g, '\\"').replace(/\n/g, '\\n')}")\n`;
        if (script.params) {
          builder += `${indent(level + 2)}.params(Map.of(/* script params */))\n`;
        }
        builder += `${indent(level + 1)}))\n`;
      }
      if (minScore !== undefined) {
        builder += `${indent(level + 1)}.minScore(${minScore})\n`;
      }
      builder += `${indent(level)})`;
      return builder;
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
  lines.push('import co.elastic.clients.elasticsearch._types.FieldValue;');
  lines.push(
    'import co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType;'
  );
  lines.push('import co.elastic.clients.json.JsonData;');
  lines.push('import java.util.List;');
  lines.push('import java.util.Map;');
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

  if (raw._source !== undefined) {
    const source = raw._source as
      | boolean
      | string[]
      | { includes?: string[]; excludes?: string[] };
    if (typeof source === 'boolean') {
      lines.push(`    .source(sc -> sc.fetch(${source}))`);
    } else if (Array.isArray(source)) {
      const fields = source.map((f) => `"${f}"`).join(', ');
      lines.push(`    .source(sc -> sc.filter(f -> f.includes(${fields})))`);
    } else if (source.includes || source.excludes) {
      const parts: string[] = [];
      if (source.includes) {
        const includes = source.includes.map((f) => `"${f}"`).join(', ');
        parts.push(`includes(${includes})`);
      }
      if (source.excludes) {
        const excludes = source.excludes.map((f) => `"${f}"`).join(', ');
        parts.push(`excludes(${excludes})`);
      }
      lines.push(`    .source(sc -> sc.filter(f -> f.${parts.join('.')}))`);
    }
  }

  lines.push(');');
  lines.push('');
  lines.push(
    'SearchResponse<Object> response = client.search(request, Object.class);'
  );

  return lines.join('\n');
}
