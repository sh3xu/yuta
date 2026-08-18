import type { ActionName, AIRequest, AIResponse, EmotionName } from '@yuta/shared';
import type { AIGenerateOptions, AIProvider } from './types';

const KEYWORDS: Array<{ match: RegExp; emotion: EmotionName; action?: ActionName; line?: string }> =
  [
    { match: /\b(look up|glance up)\b/i, emotion: 'curious', action: 'lookUp' },
    { match: /\b(look down|glance down)\b/i, emotion: 'curious', action: 'lookDown' },
    { match: /\b(look left|glance left)\b/i, emotion: 'curious', action: 'lookLeft' },
    { match: /\b(look right|glance right)\b/i, emotion: 'curious', action: 'lookRight' },
    { match: /\b(shake (your )?head|nope)\b/i, emotion: 'neutral', action: 'shakeNo' },
    { match: /\b(blow (a )?kiss)\b/i, emotion: 'happy', action: 'blowKiss' },
    { match: /\b(facepalm)\b/i, emotion: 'sad', action: 'facepalm' },
    { match: /\b(salute)\b/i, emotion: 'happy', action: 'salute' },
    { match: /\b(clap|applause)\b/i, emotion: 'happy', action: 'clap' },
    { match: /\b(point)\b/i, emotion: 'curious', action: 'point' },
    { match: /\b(gasp|whoa|startle)\b/i, emotion: 'surprised', action: 'gasp' },
    { match: /\b(dance|groove)\b/i, emotion: 'happy', action: 'dance' },
    { match: /\b(sway|wiggle)\b/i, emotion: 'happy', action: 'sway' },
    { match: /\b(peek)\b/i, emotion: 'curious', action: 'peek' },
    { match: /\b(sleep|sleepy|tired)\b/i, emotion: 'sad', action: 'sleep' },
    { match: /\b(fidget|nervous)\b/i, emotion: 'curious', action: 'fidget' },
    { match: /\b(bounce)\b/i, emotion: 'happy', action: 'bounce' },
    { match: /\b(celebrate|cheer|hooray)\b/i, emotion: 'happy', action: 'celebrate' },
    { match: /\b(stretch|yawn)\b/i, emotion: 'neutral', action: 'stretch' },
    { match: /\b(shrug|dunno)\b/i, emotion: 'curious', action: 'shrug' },
    { match: /\b(bow|curtsy)\b/i, emotion: 'happy', action: 'bow' },
    { match: /\b(wink)\b/i, emotion: 'happy', action: 'wink' },
    { match: /\b(lean in|lean closer)\b/i, emotion: 'curious', action: 'leanIn' },
    { match: /\b(think|hmm|ponder)\b/i, emotion: 'curious', action: 'think' },
    { match: /\b(shy|embarrassed|blush)\b/i, emotion: 'happy', action: 'shy' },
    {
      match: /\b(jump|hop|leap)\b/i,
      emotion: 'happy',
      action: 'jump',
      line: 'Okay — jumping!',
    },
    { match: /\b(wave|hi there)\b/i, emotion: 'happy', action: 'wave' },
    { match: /\b(nod|yes|agree)\b/i, emotion: 'happy', action: 'nod' },
    { match: /\b(laugh|haha|lol)\b/i, emotion: 'happy', action: 'laugh' },
    { match: /thank|love|great|happy|yay|awesome/i, emotion: 'happy', action: 'laugh' },
    { match: /sad|miss|lonely|hurt/i, emotion: 'sad', action: 'headTilt' },
    { match: /wow|surprise|really\?/i, emotion: 'surprised', action: 'gasp' },
    { match: /why|how|what|explain|curious/i, emotion: 'curious', action: 'think' },
    { match: /hello|hi|hey|good morning|good evening/i, emotion: 'happy', action: 'wave' },
  ];

export class MockProvider implements AIProvider {
  readonly id = 'mock';

  async generate(request: AIRequest, options?: AIGenerateOptions): Promise<AIResponse> {
    const hit = KEYWORDS.find((item) => item.match.test(request.userMessage));
    const emotion = hit?.emotion ?? 'neutral';
    const action = hit?.action ?? 'nod';
    const memoryMatch = request.userMessage.match(
      /(?:i (?:like|love|prefer)|my name is|remember that)\s+(.+)/i,
    );
    const lookups = needsMemoryLookup(request.userMessage)
      ? ((await options?.lookupMemory?.(request.userMessage)) ?? [])
      : [];

    return {
      message: hit?.line ?? buildMockReply(emotion, lookups[0]?.title),
      emotion: { name: emotion, intensity: hit ? 0.85 : 0.5 },
      action: { name: action, intensity: 1 },
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

const LOOKUP_QUERY =
  /\b(remember|who is|what's my|whats my|what is my|did i (tell|say)|have i told|my name|favorite)\b/i;

function needsMemoryLookup(message: string): boolean {
  return LOOKUP_QUERY.test(message);
}

function buildMockReply(emotion: EmotionName, memoryTitle?: string): string {
  const memoryNote = memoryTitle ? ` I found this: ${memoryTitle}.` : '';

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
