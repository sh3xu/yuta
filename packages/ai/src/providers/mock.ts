import type { AIRequest, AIResponse, ActionName, EmotionName } from '@yuta/shared';
import type { AIProvider } from './types';

const KEYWORDS: Array<{ match: RegExp; emotion: EmotionName; action?: ActionName; line?: string }> = [
  { match: /\b(jump|hop|leap|bounce)\b/i, emotion: 'happy', action: 'jump', line: 'Okay — jumping!' },
  { match: /\b(wave|hi there)\b/i, emotion: 'happy', action: 'wave' },
  { match: /\b(nod|yes)\b/i, emotion: 'happy', action: 'nod' },
  { match: /\b(laugh|haha|lol)\b/i, emotion: 'happy', action: 'laugh' },
  { match: /thank|love|great|happy|yay|awesome/i, emotion: 'happy', action: 'laugh' },
  { match: /sad|miss|lonely|tired|hurt/i, emotion: 'sad', action: 'headTilt' },
  { match: /wow|whoa|surprise|really\?/i, emotion: 'surprised', action: 'wave' },
  { match: /why|how|what|explain|curious/i, emotion: 'curious', action: 'headTilt' },
  { match: /hello|hi|hey|good morning|good evening/i, emotion: 'happy', action: 'wave' },
];

export class MockProvider implements AIProvider {
  readonly id = 'mock';

  async generate(request: AIRequest): Promise<AIResponse> {
    const hit = KEYWORDS.find((item) => item.match.test(request.userMessage));
    const emotion = hit?.emotion ?? 'neutral';
    const action = hit?.action ?? 'nod';
    const memoryMatch = request.userMessage.match(
      /(?:i (?:like|love|prefer)|my name is|remember that)\s+(.+)/i,
    );

    return {
      message: hit?.line ?? buildMockReply(request, emotion),
      emotion: { name: emotion, intensity: hit ? 0.72 : 0.45 },
      action: { name: action, intensity: 0.6 },
      memory: memoryMatch
        ? {
            shouldStore: true,
            category: /name/i.test(request.userMessage) ? 'profile' : 'preferences',
            content: request.userMessage,
            tags: ['mock', 'user-stated'],
          }
        : { shouldStore: false },
    };
  }
}

function buildMockReply(request: AIRequest, emotion: EmotionName): string {
  const memoryNote =
    request.memories[0] != null
      ? ` I still have this nearby: ${request.memories[0].title}.`
      : '';

  switch (emotion) {
    case 'happy':
      return `Hey — that made me smile.${memoryNote} Want to keep going?`;
    case 'sad':
      return `I'm here with you.${memoryNote} We can take this slowly.`;
    case 'surprised':
      return `Wait, really?${memoryNote} Tell me more.`;
    case 'curious':
      return `That is an interesting thread.${memoryNote} What part should we unpack first?`;
    default:
      return `I'm listening.${memoryNote} What would you like to do next?`;
  }
}
