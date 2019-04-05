import fromPairs from 'lodash/fromPairs';
import zip from 'lodash/zip';
import pathToRegexp, { Key } from 'path-to-regexp';
import {DocumentPath, CollectionPath, encodePath} from './Path';

export interface Reader {
  get(path: DocumentPath): Promise<object | undefined>;
  list(path: CollectionPath): Promise<object[]>;
  getUserId(): Promise<string | undefined>;
}

export type RuleFunction = (path: DocumentPath, params: {[key: string]: string | undefined}, reader: Reader) => Promise<boolean>;

export default interface Rule {
  path: string;
  read: boolean | RuleFunction;
  write: boolean | RuleFunction;
}

export interface CompiledRule {
  keys: Key[],
  regexp: RegExp;
  read: boolean | RuleFunction;
  write: boolean | RuleFunction;
}

/**
 * Compile rules
 * @param {Rule[]} rules - Rules for compile
 * @return {CompiledRule[]} Rules compiled
 */
export function compile(rules: Rule[]): CompiledRule[] {
  return rules.map((rule) => {
    const keys: Key[] = [];
    return {
      keys,
      regexp: pathToRegexp(rule.path.substr(1), keys),
      read: rule.read,
      write: rule.write,
    };
  });
}

/**
 * Authorize path by rule
 * @param {DocumentPath | CollectionPath} path - Path
 * @Param {CompiledRule[]} rules - Rules
 * @param {'read' | 'write'} mode - Mode to access
 * @param {Reader} reader - Data reader
 * @return {Promise<boolean>} - Result
 */
export async function authorize(
  path: DocumentPath | CollectionPath,
  rules: CompiledRule[],
  mode: 'read' | 'write',
  reader: Reader,
): Promise<boolean> {
  const documentPath = Array.isArray(path)
    ? path
    : [...path.parentPath, {collection: path.collection, id: '$id'}];
  const encodedPath = encodePath(documentPath);
  const rule = rules.find(
    (rule) => rule.regexp.exec(encodedPath) !== null,
  );
  if (!rule) return false;

  const m = rule.regexp.exec(encodedPath);
  if (!m) return false;
  
  const cond = rule[mode];
  if (typeof cond === 'boolean') return cond;

  const pairs = zip(rule.keys, m.slice(1))
    .map(([key, value]) => key && [key.name, value])
    .filter(a => a) as [string, string | undefined][];

  return await cond(documentPath, fromPairs(pairs), reader);
}
