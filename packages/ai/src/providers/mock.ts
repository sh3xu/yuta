import { compactFact } from '@yuta/memory';
import type { ActionName, AIRequest, AIResponse, EmotionName, MemoryFact } from '@yuta/shared';
import type { AIGenerateOptions, AIProvider } from './types';

const KEYWORDS: Array<{ match: RegExp; emotion: EmotionName; action?: ActionName; line?: string }> =
  [
    { match: /\b(look up|glance up)\b/i, emotion: 'curious', action: 'lookUp' },
    { match: /\b(look down|glance down)\b/i, emotion: 'curious', action: 'lookDown' },
    { match: /\b(look left|glance left)\b/i, emotion: 'curious', action: 'lookLeft' },
    { match: /\b(look right|glance right)\b/i, emotion: 'curious', action: 'lookRight' },
    { match: /\b(shake (your )?head|nope)\b/i, emotion: 'neutral', action: 'shakeNo' },
    { match: /\b(blow (a )?kiss)\b/i, emotion: 'happy', action: 'blowKiss' },
    {
      match: /\b(cover (your )?face|both hands on (your )?face)\b/i,
      emotion: 'embarrassed',
      action: 'coverFace',
    },
    {
      match: /\b(embarrass|embarrassed|awkward|blush)\b/i,
      emotion: 'embarrassed',
      action: 'coverFace',
    },
    { match: /\b(hands on (your )?hips|akimbo)\b/i, emotion: 'angry', action: 'handsOnHips' },
    { match: /\b(angry|mad|annoyed|furious|pissed)\b/i, emotion: 'angry', action: 'handsOnHips' },
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
    { match: /\b(shy)\b/i, emotion: 'embarrassed', action: 'shy' },
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
    if (request.aside) {
      const line = ASIDES[request.history.length % ASIDES.length] ?? ASIDES[0];
      return {
        message: line,
        emotion: { name: 'happy', intensity: 0.45 },
        action: { name: 'headTilt', intensity: 0.55 },
        memory: { shouldStore: false },
      };
    }

    const hit = KEYWORDS.find((item) => item.match.test(request.userMessage));
    const emotion = hit?.emotion ?? 'neutral';
    const action = hit?.action ?? 'nod';
    const facts = extractMockFacts(request.userMessage);
    const lookups = needsMemoryLookup(request.userMessage)
      ? ((await options?.lookupMemory?.(request.userMessage)) ?? [])
      : [];

    return {
      message: hit?.line ?? buildMockReply(emotion, lookups[0]?.title),
      emotion: { name: emotion, intensity: hit ? 0.85 : 0.5 },
      action: { name: action, intensity: 1 },
      memory: facts.length > 0 ? { shouldStore: true, facts } : { shouldStore: false },
    };
  }
}

const ASIDES = [
  'Still here, by the way.',
  'You look busy. I will keep it short.',
  'Hey. Just saying hi.',
  'I am around if you need me.',
  'Nice to see you at the desk.',
];

const LOOKUP_QUERY =
  /\b(remember|who is|what's my|whats my|what is my|did i (tell|say)|have i told|my name|favorite)\b/i;

function extractMockFacts(message: string): MemoryFact[] {
  const facts: MemoryFact[] = [];
  const dislike = message.match(/i (?:don't|dont|do not) like\s+([^,.]+?)(?=\s+but\b|[.,]|$)/i);
  if (dislike?.[1]) {
    facts.push({
      category: 'preferences',
      topic: 'dislikes',
      content: compactFact(`dislike ${dislike[1]}`),
    });
  }
  const fav =
    message.match(/\bbut\s+([^,.]+?)\s+(?:are|is)\s+fav/i) ??
    message.match(/\bfav(?:orite)?(?:\s+fruit)?(?:\s+is)?\s+([^,.]+)/i);
  if (fav?.[1] && !/^i\b/i.test(fav[1].trim())) {
    facts.push({
      category: 'preferences',
      topic: 'likes',
      content: compactFact(`fav ${fav[1]}`),
    });
  }
  const name = message.match(/my name is\s+(.+)/i);
  if (name?.[1]) {
    facts.push({
      category: 'profile',
      topic: 'name',
      content: compactFact(`name ${name[1]}`),
    });
  }
  const like = message.match(/\bi (?:like|love|prefer)\s+(.+)/i);
  if (like?.[1] && facts.every((fact) => fact.topic !== 'likes')) {
    facts.push({
      category: 'preferences',
      topic: 'likes',
      content: compactFact(`like ${like[1]}`),
    });
  }
  const remember = message.match(/remember that\s+(.+)/i);
  if (remember?.[1] && facts.length === 0) {
    facts.push({
      category: 'knowledge',
      content: compactFact(remember[1]),
    });
  }
  return facts.filter((fact) => fact.content.length > 0);
}

function needsMemoryLookup(message: string): boolean {
  return LOOKUP_QUERY.test(message);
}

function buildMockReply(emotion: EmotionName, memoryTitle?: string): string {
  const memoryNote = memoryTitle ? ` I found this: ${memoryTitle}.` : '';

  switch (emotion) {
    case 'embarrassed':
      return `Ah — that got to me.${memoryNote} Give me a second.`;
    case 'angry':
      return `Okay, that is not sitting well.${memoryNote} Say that again?`;
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
