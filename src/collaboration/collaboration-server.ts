import { AnalysisReport } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export interface CollaborationSession {
  id: string;
  projectPath: string;
  participants: Participant[];
  comments: Comment[];
  sharedReport: AnalysisReport | null;
  createdAt: string;
  lastActivity: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'reviewer' | 'viewer';
  joinedAt: string;
  isActive: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  module: string;
  line?: number;
  text: string;
  type: 'comment' | 'suggestion' | 'issue';
  status: 'open' | 'resolved';
  createdAt: string;
  replies: CommentReply[];
}

export interface CommentReply {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface NotificationConfig {
  slack?: {
    webhookUrl: string;
    channel: string;
  };
  teams?: {
    webhookUrl: string;
  };
  email?: {
    smtp: string;
    from: string;
    to: string[];
  };
}

export class CollaborationManager {
  private sessions: Map<string, CollaborationSession> = new Map();
  private sessionsFile: string;
  private notifications: NotificationConfig;

  constructor(sessionsFile: string = '.auto-architect-sessions.json', notifications?: NotificationConfig) {
    this.sessionsFile = sessionsFile;
    this.notifications = notifications || {};
    this.loadSessions();
  }

  /**
   * Create a new collaboration session
   */
  createSession(projectPath: string, owner: Participant): CollaborationSession {
    const session: CollaborationSession = {
      id: this.generateId(),
      projectPath,
      participants: [owner],
      comments: [],
      sharedReport: null,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    this.sessions.set(session.id, session);
    this.saveSessions();

    return session;
  }

  /**
   * Join an existing session
   */
  joinSession(sessionId: string, participant: Participant): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    // Check if participant already exists
    const existing = session.participants.find(p => p.id === participant.id);
    if (existing) {
      existing.isActive = true;
    } else {
      session.participants.push(participant);
    }

    session.lastActivity = new Date().toISOString();
    this.saveSessions();

    this.notifyParticipants(session, `${participant.name} joined the session`);

    return true;
  }

  /**
   * Leave a session
   */
  leaveSession(sessionId: string, participantId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    const participant = session.participants.find(p => p.id === participantId);
    if (participant) {
      participant.isActive = false;
      session.lastActivity = new Date().toISOString();
      this.saveSessions();
    }

    return true;
  }

  /**
   * Share analysis report with session
   */
  shareReport(sessionId: string, report: AnalysisReport): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    session.sharedReport = report;
    session.lastActivity = new Date().toISOString();
    this.saveSessions();

    this.notifyParticipants(session, 'New analysis report shared');

    return true;
  }

  /**
   * Add a comment to a session
   */
  addComment(sessionId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'replies'>): Comment | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    const fullComment: Comment = {
      ...comment,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      replies: []
    };

    session.comments.push(fullComment);
    session.lastActivity = new Date().toISOString();
    this.saveSessions();

    this.notifyParticipants(
      session,
      `${comment.authorName} commented on ${comment.module}`,
      comment.text
    );

    return fullComment;
  }

  /**
   * Reply to a comment
   */
  replyToComment(
    sessionId: string,
    commentId: string,
    reply: Omit<CommentReply, 'id' | 'createdAt'>
  ): CommentReply | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    const comment = session.comments.find(c => c.id === commentId);
    if (!comment) {
      return null;
    }

    const fullReply: CommentReply = {
      ...reply,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };

    comment.replies.push(fullReply);
    session.lastActivity = new Date().toISOString();
    this.saveSessions();

    return fullReply;
  }

  /**
   * Resolve a comment
   */
  resolveComment(sessionId: string, commentId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    const comment = session.comments.find(c => c.id === commentId);
    if (!comment) {
      return false;
    }

    comment.status = 'resolved';
    session.lastActivity = new Date().toISOString();
    this.saveSessions();

    return true;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.participants.some(p => p.isActive));
  }

  /**
   * Get comments for a module
   */
  getModuleComments(sessionId: string, moduleName: string): Comment[] {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return [];
    }

    return session.comments.filter(c => c.module === moduleName);
  }

  /**
   * Send notification to participants
   */
  private async notifyParticipants(
    session: CollaborationSession,
    message: string,
    details?: string
  ): Promise<void> {
    const activeParticipants = session.participants.filter(p => p.isActive);

    // Slack notification
    if (this.notifications.slack) {
      await this.sendSlackNotification(message, details);
    }

    // Teams notification
    if (this.notifications.teams) {
      await this.sendTeamsNotification(message, details);
    }

    // Email notification (simplified)
    if (this.notifications.email) {
      console.log(`📧 Email notification: ${message}`);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(message: string, details?: string): Promise<void> {
    if (!this.notifications.slack) return;

    const payload = {
      channel: this.notifications.slack.channel,
      text: message,
      attachments: details ? [{
        text: details,
        color: '#36a64f'
      }] : []
    };

    // In a real implementation, use fetch or axios to send to webhook
    console.log(`📱 Slack notification: ${message}`);
  }

  /**
   * Send Teams notification
   */
  private async sendTeamsNotification(message: string, details?: string): Promise<void> {
    if (!this.notifications.teams) return;

    const payload = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: message,
      sections: [{
        activityTitle: message,
        text: details || ''
      }]
    };

    // In a real implementation, use fetch or axios to send to webhook
    console.log(`💬 Teams notification: ${message}`);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load sessions from file
   */
  private loadSessions(): void {
    if (!fs.existsSync(this.sessionsFile)) {
      return;
    }

    try {
      const content = fs.readFileSync(this.sessionsFile, 'utf-8');
      const sessions = JSON.parse(content);
      
      sessions.forEach((session: CollaborationSession) => {
        this.sessions.set(session.id, session);
      });
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }

  /**
   * Save sessions to file
   */
  private saveSessions(): void {
    const sessions = Array.from(this.sessions.values());
    fs.writeFileSync(this.sessionsFile, JSON.stringify(sessions, null, 2));
  }

  /**
   * Export session as markdown report
   */
  exportSessionReport(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return '';
    }

    let report = `# Collaboration session report\n\n`;
    report += `**Project:** ${session.projectPath}\n`;
    report += `**Created:** ${new Date(session.createdAt).toLocaleString()}\n`;
    report += `**Last activity:** ${new Date(session.lastActivity).toLocaleString()}\n\n`;

    report += `## Participants (${session.participants.length})\n\n`;
    session.participants.forEach(p => {
      const status = p.isActive ? '🟢' : '⚪';
      report += `- ${status} ${p.name} (${p.role})\n`;
    });

    report += `\n## Comments (${session.comments.length})\n\n`;
    session.comments.forEach(c => {
      const icon = c.type === 'issue' ? '🔴' : c.type === 'suggestion' ? '💡' : '💬';
      const status = c.status === 'resolved' ? '✓' : '○';
      
      report += `### ${icon} ${status} ${c.module}\n`;
      report += `**${c.authorName}** - ${new Date(c.createdAt).toLocaleString()}\n\n`;
      report += `${c.text}\n\n`;

      if (c.replies.length > 0) {
        report += `**Replies:**\n`;
        c.replies.forEach(r => {
          report += `- ${r.authorName}: ${r.text}\n`;
        });
        report += '\n';
      }
    });

    return report;
  }
}
