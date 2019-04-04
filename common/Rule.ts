import pathToRegexp from 'path-to-regexp';
import {DocumentPath, CollectionPath, encodePath} from './Path';

export default interface Rule {
  path: string;
  read: boolean;
  write: boolean;
}

export interface CompiledRule {
  regexp: RegExp;
  read: boolean;
  write: boolean;
}

/**
 * Compile rules
 * @param {Rule[]} rules - Rules for compile
 * @return {CompiledRule[]} Rules compiled
 */
export function compile(rules: Rule[]): CompiledRule[] {
  return rules.map((rule) => ({
    regexp: pathToRegexp(rule.path.substr(1)),
    read: rule.read,
    write: rule.write,
  }));
}

/**
 * Authorize path by rule
 * @param {DocumentPath | CollectionPath} path - Path
 * @Param {CompiledRule[]} rules - Rules
 * @param {'read' | 'write'} mode - Mode to access
 * @return {Promise<boolean>} - Result
 */
export async function authorize(
  path: DocumentPath | CollectionPath,
  rules: CompiledRule[],
  mode: 'read' | 'write',
): Promise<boolean> {
  const documentPath = Array.isArray(path)
    ? path
    : [...path.parentPath, {collection: path.collection, id: '$id'}];
  const encodedPath = encodePath(documentPath);
  const rule = rules.find(
    (rule) => rule.regexp.exec(encodedPath) !== null,
  );
  if (!rule || !rule[mode]) return false;
  return true;
}
