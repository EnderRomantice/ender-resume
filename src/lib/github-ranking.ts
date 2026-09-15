import type { GitHubProject } from './github-portfolio-types';

export function rankGitHubProjects(projects: GitHubProject[]) {
  const largestStarCount = Math.max(0, ...projects.map((project) => project.stars));
  const starScale = Math.log1p(largestStarCount);

  return projects.map((project) => {
    const rank = project.contributorRank;
    const rankScore = rank !== null && Number.isSafeInteger(rank) && rank > 0 ? 1 / rank : 0;
    const starScore = starScale > 0 ? Math.log1p(Math.max(0, project.stars)) / starScale : 0;
    return { ...project, score: 0.5 * rankScore + 0.5 * starScore };
  }).sort((a, b) => b.score - a.score || b.stars - a.stars || a.fullName.localeCompare(b.fullName));
}
