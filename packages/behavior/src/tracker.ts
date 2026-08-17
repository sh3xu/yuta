import { BEHAVIOR_WINDOW, type BehaviorHint, type ChatTurn } from '@yuta/shared';

interface Observation {
  role: ChatTurn['role'];
  content: string;
  at: number;
  length: number;
  frustrated: boolean;
}

const FRUSTRATION = /\b(ugh|stupid|why is|broken|fix this|just tell me)\b/i;
const PLAYFUL = /\b(haha|lol|hehe|joke|fun)\b/i;

export class BehaviorTracker {
  private readonly observations: Observation[] = [];

  observe(content: string, role: ChatTurn['role']): void {
    this.observations.push({
      role,
      content,
      at: Date.now(),
      length: content.trim().length,
      frustrated: FRUSTRATION.test(content),
    });
    if (this.observations.length > BEHAVIOR_WINDOW) {
      this.observations.shift();
    }
  }

  getHint(): BehaviorHint {
    const userTurns = this.observations.filter((item) => item.role === 'user');
    if (userTurns.length === 0) {
      return {
        verbosity: 'medium',
        tone: 'warm',
        avoid: [],
        summary: 'No recent pattern yet. Stay friendly and concise.',
      };
    }

    const avgLength =
      userTurns.reduce((sum, item) => sum + item.length, 0) / userTurns.length;
    const frustrated = userTurns.filter((item) => item.frustrated).length >= 2;
    const playful = userTurns.some((item) => PLAYFUL.test(item.content));

    if (frustrated || avgLength < 40) {
      return {
        verbosity: 'low',
        tone: 'direct',
        avoid: ['unnecessary_explanation'],
        summary: 'User is sending short or frustrated messages. Prefer direct answers.',
      };
    }

    if (playful) {
      return {
        verbosity: 'medium',
        tone: 'playful',
        avoid: [],
        summary: 'User is playful. Light tone is welcome.',
      };
    }

    if (avgLength > 160) {
      return {
        verbosity: 'high',
        tone: 'warm',
        avoid: [],
        summary: 'User writes longer messages. Matching depth is fine.',
      };
    }

    return {
      verbosity: 'medium',
      tone: 'warm',
      avoid: [],
      summary: 'Steady conversation. Stay present and specific.',
    };
  }

  snapshot(): Observation[] {
    return [...this.observations];
  }
}
