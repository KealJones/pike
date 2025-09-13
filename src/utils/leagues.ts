export type LeagueCpCap = 1500 | 2500 | 10000;
export const leagueCpCaps: LeagueCpCap[] = [1500, 2500, 10000];
export const leagueCpCapToName: Record<LeagueCpCap, string> = {
  1500: 'Great',
  2500: 'Ultra',
  10000: 'Master',
};
