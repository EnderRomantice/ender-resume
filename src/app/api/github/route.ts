import { getGitHubPortfolio } from '@/lib/github-portfolio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET() {
  const data = await getGitHubPortfolio();
  return Response.json(data, {
    headers: {
      // A fallback response must not mask recovery for a whole hour.
      'Cache-Control': data.stale
        ? 'public, max-age=0, s-maxage=30, stale-while-revalidate=60'
        : 'public, max-age=0, s-maxage=3600, stale-while-revalidate=300',
      'X-GitHub-Data-Source': data.source,
      'X-GitHub-Data-Stale': String(data.stale),
    },
  });
}
