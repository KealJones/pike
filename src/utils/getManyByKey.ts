import { getMany } from 'idb-keyval';

export async function getManyByKey<T>(
  keys: string[],
): Promise<Record<string, T>> {
  const keyedResults: Record<string, T> = {};
  const results = await getMany<T>(keys);
  for (let i = 0; i < keys.length; i++) {
    keyedResults[keys[i]] = results[i];
  }
  return keyedResults;
}
