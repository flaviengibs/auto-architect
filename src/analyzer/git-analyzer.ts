import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface GitMetrics {
  totalCommits: number;
  contributors: number;
  avgCommitsPerDay: number;
  codeChurn: CodeChurnMetrics;
  hotFiles: HotFile[];
  busFactor: number;
  commitFrequency: CommitFrequency;
  authorStats: AuthorStats[];
}

export interface CodeChurnMetrics {
  totalAdditions: number;
  totalDeletions: number;
  churnRate: number;
  highChurnFiles: string[];
}

export interface HotFile {
  path: string;
  commits: number;
  authors: number;
  lastModified: string;
  churnScore: number;
}

export interface CommitFrequency {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface AuthorStats {
  name: string;
  commits: number;
  additions: number;
  deletions: number;
  filesChanged: number;
  percentage: number;
}

export class GitAnalyzer {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  analyze(): GitMetrics | null {
    if (!this.isGitRepository()) {
      return null;
    }

    try {
      const totalCommits = this.getTotalCommits();
      const contributors = this.getContributors();
      const codeChurn = this.getCodeChurn();
      const hotFiles = this.getHotFiles();
      const busFactor = this.calculateBusFactor();
      const commitFrequency = this.getCommitFrequency();
      const authorStats = this.getAuthorStats(totalCommits);

      return {
        totalCommits,
        contributors,
        avgCommitsPerDay: commitFrequency.daily,
        codeChurn,
        hotFiles,
        busFactor,
        commitFrequency,
        authorStats
      };
    } catch (error) {
      console.error('Git analysis failed:', error);
      return null;
    }
  }

  private isGitRepository(): boolean {
    try {
      const gitDir = path.join(this.projectPath, '.git');
      return fs.existsSync(gitDir);
    } catch {
      return false;
    }
  }

  private getTotalCommits(): number {
    try {
      const output = execSync('git rev-list --count HEAD', {
        cwd: this.projectPath,
        encoding: 'utf-8'
      });
      return parseInt(output.trim());
    } catch {
      return 0;
    }
  }

  private getContributors(): number {
    try {
      const output = execSync('git shortlog -sn --all', {
        cwd: this.projectPath,
        encoding: 'utf-8'
      });
      return output.trim().split('\n').length;
    } catch {
      return 0;
    }
  }

  private getCodeChurn(): CodeChurnMetrics {
    try {
      const output = execSync('git log --numstat --pretty="%H" --since="1 year ago"', {
        cwd: this.projectPath,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024
      });

      let totalAdditions = 0;
      let totalDeletions = 0;
      const fileChurn = new Map<string, number>();

      const lines = output.split('\n');
      for (const line of lines) {
        const match = line.match(/^(\d+)\s+(\d+)\s+(.+)$/);
        if (match) {
          const additions = parseInt(match[1]);
          const deletions = parseInt(match[2]);
          const file = match[3];

          totalAdditions += additions;
          totalDeletions += deletions;

          const churn = additions + deletions;
          fileChurn.set(file, (fileChurn.get(file) || 0) + churn);
        }
      }

      const highChurnFiles = Array.from(fileChurn.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([file]) => file);

      const churnRate = totalAdditions + totalDeletions;

      return {
        totalAdditions,
        totalDeletions,
        churnRate,
        highChurnFiles
      };
    } catch {
      return {
        totalAdditions: 0,
        totalDeletions: 0,
        churnRate: 0,
        highChurnFiles: []
      };
    }
  }

  private getHotFiles(): HotFile[] {
    try {
      const output = execSync('git log --name-only --pretty=format:"%H|%an|%ad" --date=short --since="6 months ago"', {
        cwd: this.projectPath,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024
      });

      const fileStats = new Map<string, { commits: Set<string>, authors: Set<string>, lastModified: string }>();

      const lines = output.split('\n');
      let currentCommit = '';
      let currentAuthor = '';
      let currentDate = '';

      for (const line of lines) {
        if (line.includes('|')) {
          const [commit, author, date] = line.split('|');
          currentCommit = commit;
          currentAuthor = author;
          currentDate = date;
        } else if (line.trim() && !line.startsWith(' ')) {
          const file = line.trim();
          if (!fileStats.has(file)) {
            fileStats.set(file, {
              commits: new Set(),
              authors: new Set(),
              lastModified: currentDate
            });
          }
          const stats = fileStats.get(file)!;
          stats.commits.add(currentCommit);
          stats.authors.add(currentAuthor);
          if (currentDate > stats.lastModified) {
            stats.lastModified = currentDate;
          }
        }
      }

      const hotFiles: HotFile[] = Array.from(fileStats.entries())
        .map(([path, stats]) => ({
          path,
          commits: stats.commits.size,
          authors: stats.authors.size,
          lastModified: stats.lastModified,
          churnScore: stats.commits.size * stats.authors.size
        }))
        .sort((a, b) => b.churnScore - a.churnScore)
        .slice(0, 15);

      return hotFiles;
    } catch {
      return [];
    }
  }

  private calculateBusFactor(): number {
    try {
      const output = execSync('git shortlog -sn --all', {
        cwd: this.projectPath,
        encoding: 'utf-8'
      });

      const authorCommits = output.trim().split('\n').map(line => {
        const match = line.trim().match(/^(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });

      const totalCommits = authorCommits.reduce((sum, count) => sum + count, 0);
      let cumulativeCommits = 0;
      let busFactor = 0;

      for (const commits of authorCommits) {
        cumulativeCommits += commits;
        busFactor++;
        if (cumulativeCommits >= totalCommits * 0.5) {
          break;
        }
      }

      return busFactor;
    } catch {
      return 0;
    }
  }

  private getCommitFrequency(): CommitFrequency {
    try {
      const dailyOutput = execSync('git log --since="30 days ago" --oneline', {
        cwd: this.projectPath,
        encoding: 'utf-8'
      });
      const daily = dailyOutput.trim().split('\n').filter(l => l).length / 30;

      const weeklyOutput = execSync('git log --since="12 weeks ago" --oneline', {
        cwd: this.projectPath,
        encoding: 'utf-8'
      });
      const weekly = weeklyOutput.trim().split('\n').filter(l => l).length / 12;

      const monthlyOutput = execSync('git log --since="12 months ago" --oneline', {
        cwd: this.projectPath,
        encoding: 'utf-8'
      });
      const monthly = monthlyOutput.trim().split('\n').filter(l => l).length / 12;

      return {
        daily: Math.round(daily * 10) / 10,
        weekly: Math.round(weekly * 10) / 10,
        monthly: Math.round(monthly * 10) / 10
      };
    } catch {
      return { daily: 0, weekly: 0, monthly: 0 };
    }
  }

  private getAuthorStats(totalCommits: number): AuthorStats[] {
    try {
      const output = execSync('git log --numstat --pretty=format:"%an"', {
        cwd: this.projectPath,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024
      });

      const authorData = new Map<string, { commits: number, additions: number, deletions: number, files: Set<string> }>();
      let currentAuthor = '';

      const lines = output.split('\n');
      for (const line of lines) {
        if (line && !line.match(/^\d+\s+\d+/)) {
          currentAuthor = line.trim();
          if (!authorData.has(currentAuthor)) {
            authorData.set(currentAuthor, { commits: 0, additions: 0, deletions: 0, files: new Set() });
          }
          authorData.get(currentAuthor)!.commits++;
        } else {
          const match = line.match(/^(\d+)\s+(\d+)\s+(.+)$/);
          if (match && currentAuthor) {
            const data = authorData.get(currentAuthor)!;
            data.additions += parseInt(match[1]);
            data.deletions += parseInt(match[2]);
            data.files.add(match[3]);
          }
        }
      }

      return Array.from(authorData.entries())
        .map(([name, data]) => ({
          name,
          commits: data.commits,
          additions: data.additions,
          deletions: data.deletions,
          filesChanged: data.files.size,
          percentage: Math.round((data.commits / totalCommits) * 100 * 10) / 10
        }))
        .sort((a, b) => b.commits - a.commits)
        .slice(0, 10);
    } catch {
      return [];
    }
  }
}
