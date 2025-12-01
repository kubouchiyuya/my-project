#!/usr/bin/env tsx

/**
 * Generate Dashboard Data Script
 *
 * This script fetches data from GitHub Projects API and generates
 * a JSON file for the dashboard to consume.
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';

interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  url: string;
  updatedAt: string;
  labels: string[];
  status?: string;
}

interface DashboardData {
  stats: {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
  };
  recentIssues: GitHubIssue[];
  generatedAt: string;
}

/**
 * Fetch data from GitHub GraphQL API
 */
async function fetchProjectData(): Promise<DashboardData> {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY || '';
  const projectNumber = parseInt(process.env.GITHUB_PROJECT_NUMBER || '1');

  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  if (!repository) {
    throw new Error('GITHUB_REPOSITORY environment variable is required');
  }

  const [owner, repo] = repository.split('/');

  // GraphQL query to fetch project data
  const query = `
    query($owner: String!, $repo: String!, $projectNumber: Int!) {
      repository(owner: $owner, name: $repo) {
        projectV2(number: $projectNumber) {
          items(first: 100) {
            nodes {
              content {
                ... on Issue {
                  number
                  title
                  state
                  url
                  updatedAt
                  labels(first: 10) {
                    nodes {
                      name
                    }
                  }
                }
              }
              fieldValues(first: 10) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                    field {
                      ... on ProjectV2SingleSelectField {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { owner, repo, projectNumber },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  // Process the data
  const items = data.data?.repository?.projectV2?.items?.nodes || [];
  const issues: GitHubIssue[] = [];

  let totalCount = 0;
  let openCount = 0;
  let inProgressCount = 0;
  let completedCount = 0;

  for (const item of items) {
    if (!item.content) continue;

    const issue = item.content;
    totalCount++;

    // Extract status from field values
    let status = 'No status';
    for (const fieldValue of item.fieldValues?.nodes || []) {
      if (fieldValue.field?.name === 'Status') {
        status = fieldValue.name;
        break;
      }
    }

    // Count by status
    const statusLower = status.toLowerCase();
    if (statusLower.includes('progress') || statusLower.includes('doing')) {
      inProgressCount++;
    } else if (statusLower.includes('done') || statusLower.includes('complete')) {
      completedCount++;
    } else if (issue.state === 'OPEN') {
      openCount++;
    }

    issues.push({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      url: issue.url,
      updatedAt: issue.updatedAt,
      labels: issue.labels?.nodes?.map((l: any) => l.name) || [],
      status,
    });
  }

  // Sort by updated date (most recent first)
  issues.sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return {
    stats: {
      total: totalCount,
      open: openCount,
      inProgress: inProgressCount,
      completed: completedCount,
    },
    recentIssues: issues.slice(0, 20), // Top 20 recent issues
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate mock data for development/testing
 */
function generateMockData(): DashboardData {
  return {
    stats: {
      total: 15,
      open: 5,
      inProgress: 3,
      completed: 7,
    },
    recentIssues: [
      {
        number: 1,
        title: 'Setup GitHub Projects Integration',
        state: 'OPEN',
        url: 'https://github.com/example/repo/issues/1',
        updatedAt: new Date().toISOString(),
        labels: ['feature', 'high-priority'],
        status: 'In Progress',
      },
      {
        number: 2,
        title: 'Add Dashboard Visualization',
        state: 'OPEN',
        url: 'https://github.com/example/repo/issues/2',
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        labels: ['enhancement', 'ui'],
        status: 'Todo',
      },
      {
        number: 3,
        title: 'Fix CI/CD Pipeline',
        state: 'CLOSED',
        url: 'https://github.com/example/repo/issues/3',
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
        labels: ['bug', 'ci-cd'],
        status: 'Done',
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🎋 Generating dashboard data...');

    let data: DashboardData;

    // Try to fetch real data, fall back to mock data if it fails
    try {
      data = await fetchProjectData();
      console.log('✓ Successfully fetched data from GitHub Projects');
    } catch (error) {
      console.warn('⚠ Failed to fetch GitHub data, using mock data:', error);
      data = generateMockData();
    }

    // Write to file
    const outputPath = join(process.cwd(), 'docs', 'dashboard-data.json');
    await writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`✓ Dashboard data written to: ${outputPath}`);
    console.log(`  Total issues: ${data.stats.total}`);
    console.log(`  Open: ${data.stats.open}`);
    console.log(`  In Progress: ${data.stats.inProgress}`);
    console.log(`  Completed: ${data.stats.completed}`);

  } catch (error) {
    console.error('❌ Error generating dashboard data:', error);
    process.exit(1);
  }
}

// Run the script
main();
