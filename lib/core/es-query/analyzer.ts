// lib/core/es-query/analyzer.ts

import { ESNode } from './types';

export interface Suggestion {
  nodeId: string;
  message: string;
  apply: (root: ESNode) => ESNode;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function analyzeSuggestions(_root: ESNode): Suggestion[] {
  // TODO: Implement in v2
  return [];
}
