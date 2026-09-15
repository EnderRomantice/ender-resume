export interface GitHubProject {
  id: string;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  stars: number;
  contributions: number;
  totalCommits: number;
  /** One-based position in GitHub's contributors list, or null if not listed. */
  contributorRank: number | null;
  language: string | null;
  isOwner: boolean;
}

export type GitHubContributionLevel =
  | 'NONE'
  | 'FIRST_QUARTILE'
  | 'SECOND_QUARTILE'
  | 'THIRD_QUARTILE'
  | 'FOURTH_QUARTILE';

export interface GitHubCalendar {
  totalContributions: number;
  weeks: Array<{
    contributionDays: Array<{
      date: string;
      contributionCount: number;
      contributionLevel: GitHubContributionLevel;
      weekday: number;
    }>;
  }>;
}

export interface GitHubPortfolioData {
  username: string;
  updatedAt: string;
  repositories: GitHubProject[];
  calendar: GitHubCalendar;
}

/** The API returns the data directly, with freshness metadata alongside it. */
export interface GitHubPortfolioResult extends GitHubPortfolioData {
  stale: boolean;
  source: 'github' | 'snapshot';
}
