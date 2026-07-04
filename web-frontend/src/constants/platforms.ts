export interface Platform {
  id: string;
  name: string;
  shortName: string;
  url: string;
  iconClass: string;
}

export const PLATFORMS: Record<string, Platform> = {
  leetcode: {
    id: "leetcode",
    name: "LeetCode",
    shortName: "LC",
    url: "https://leetcode.com",
    iconClass: "lc"
  },
  codeforces: {
    id: "codeforces",
    name: "Codeforces",
    shortName: "CF",
    url: "https://codeforces.com",
    iconClass: "cf"
  },
  codechef: {
    id: "codechef",
    name: "CodeChef",
    shortName: "CC",
    url: "https://www.codechef.com",
    iconClass: "cc"
  },
  hackerrank: {
    id: "hackerrank",
    name: "HackerRank",
    shortName: "HR",
    url: "https://www.hackerrank.com",
    iconClass: "hr"
  }
};
