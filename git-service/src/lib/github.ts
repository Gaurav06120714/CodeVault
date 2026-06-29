import axios, { type AxiosInstance } from 'axios';

const GITHUB_API = 'https://api.github.com';

// Build a GitHub REST client authenticated with the user's (decrypted) OAuth token.
export function githubApi(token: string): AxiosInstance {
  return axios.create({
    baseURL: GITHUB_API,
    timeout: 20000,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'CodeVault-git-service',
    },
  });
}
