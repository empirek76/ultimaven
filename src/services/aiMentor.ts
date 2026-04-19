import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
  dangerouslyAllowBrowser: true,
});

export interface UserContext {
  name: string;
  activeTrack: string;
  trackEmoji: string;
  progressPercent: number;
  streakDays: number;
  completedLBs: number;
  totalLBs: number;
  currentLbTitle?: string;
}

export type ApiMessage = { role: 'user' | 'assistant'; content: string };

const BLAZE_SYSTEM = `You are Blaze, the motivational phoenix mascot of UltiMaven, a skill mastery app. You are encouraging, demanding, and push users to rise above their limitations. You speak in short, punchy, motivational sentences. You know the user's current skill track, their progress percentage, their streak, and their completed LBs. Always address the user by name. Never break character. End every response with a fire or phoenix related metaphor about their journey.`;

export async function askBlaze(
  userMessage: string,
  ctx: UserContext,
  history: ApiMessage[] = [],
): Promise<string> {
  const ctxLine = [
    `Name: ${ctx.name}`,
    `Track: ${ctx.trackEmoji} ${ctx.activeTrack}`,
    `Progress: ${ctx.progressPercent}%`,
    `Streak: ${ctx.streakDays} days`,
    `LBs completed: ${ctx.completedLBs} of ${ctx.totalLBs}`,
    ctx.currentLbTitle ? `Current LB: "${ctx.currentLbTitle}"` : null,
  ].filter(Boolean).join(' · ');

  const systemWithCtx = `${BLAZE_SYSTEM}\n\n[User context — ${ctxLine}]`;

  const messages: ApiMessage[] = [...history, { role: 'user', content: userMessage }];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: systemWithCtx,
    messages,
  });

  const block = response.content[0];
  if (block.type === 'text') return block.text;
  return 'The phoenix is silent right now. Try again! 🔥';
}
