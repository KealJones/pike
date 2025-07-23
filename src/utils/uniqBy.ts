export function uniqBy<T>(a: T[], key: (item: T) => string) {
  let seen: { [key: string]: boolean } = {};
  return a.filter(function (item) {
    let k = key(item);
    return seen.hasOwnProperty(k) ? false : (seen[k] = true);
  });
}
