import { callLLM } from "./provider";
// ===== TYPES =====
export interface ThreadConfig {
  videoTitle: string;
  marketFocus: string;
  platformStyle: 'youtube' | 'reddit' | 'twitter' | 'discord';
  mentionedBrand: string;
  chaosLevel: number;
  memeDensity: number;
  skepticismLevel: number;
  softCtaStrength: number;
  professionalismLevel: number;
  cynicismLevel: number;
  investmentHorizon: number;
  debateIntensity: number;
  emotionalDrift: string;
  marketCycleMode: string;
}

export interface GenPersona {
  id: string;
  username: string;
  archetypeLabel: string;
  emotionalBehavior: string;
  grammarQuality: number;
  slangDensity: number;
  aggressionLevel: number;
  emotionalStability: number;
  backstory: string;
  avatarSeed: string;
}

export interface GenComment {
  id: string;
  personaId: string;
  content: string;
  parentId: string | null;
  timestampOffset: number;
  likes: number;
  dislikes: number;
  sentiment: number;
  toxicity: number;
  orderIndex: number;
}

export interface ThreadResult {
  personas: GenPersona[];
  comments: GenComment[];
  metrics: { avgSentiment: number; avgToxicity: number; engagementScore: number; controversyIndex: number };
}

// ===== UTILITIES =====
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ARCHETYPES = [
  { label: 'Burned Swing Trader', emotion: 'frustrated', grammar: [4,7], slang: [4,8], aggro: [5,8], stability: [2,5], backstories: ['lost 40% on meme stocks','got wrecked by earnings season'] },
  { label: 'ETF Boomer', emotion: 'cautious', grammar: [7,10], slang: [1,3], aggro: [1,4], stability: [7,10], backstories: ['been DCA-ing VOO for 20 years','doesnt understand options'] },
  { label: 'Crypto Survivor', emotion: 'cynical', grammar: [4,7], slang: [5,9], aggro: [3,7], stability: [3,6], backstories: ['survived 3 bear markets','holds bags from 2021'] },
  { label: 'Macro Doomer', emotion: 'paranoid', grammar: [6,9], slang: [2,5], aggro: [5,9], stability: [2,5], backstories: ['thinks the fed is out of tools','has 60% in gold'] },
  { label: 'Meme Gambler', emotion: 'euphoric', grammar: [2,5], slang: [7,10], aggro: [2,6], stability: [1,4], backstories: ['YOLO life savings into 0dte calls','diamond hands everything'] },
  { label: 'Skeptical Lurker', emotion: 'skeptical', grammar: [6,9], slang: [2,5], aggro: [3,6], stability: [6,9], backstories: ['reads everything posts nothing','trusts no guru'] },
  { label: 'Calm Realist', emotion: 'balanced', grammar: [7,10], slang: [1,4], aggro: [1,3], stability: [8,10], backstories: ['boring balanced portfolio','ignores the noise'] },
  { label: 'Anti-Guru Commenter', emotion: 'hostile', grammar: [5,8], slang: [3,7], aggro: [6,10], stability: [2,5], backstories: ['hates finance influencers','got scammed by a course once'] },
  { label: 'Newbie Investor', emotion: 'confused', grammar: [4,7], slang: [3,6], aggro: [1,4], stability: [3,6], backstories: ['doesnt know what a P/E ratio is','heard about stocks from TikTok'] },
  { label: 'Tech Bro Maximalist', emotion: 'arrogant', grammar: [6,9], slang: [3,7], aggro: [4,8], stability: [4,7], backstories: ['portfolio is NVDA MSFT AAPL','thinks AI will 10x everything'] },
];

const U_PRE = ['dark','crypto','stock','bull','bear','diamond','degen','whale','moon','hodl','spy','btc','eth','macro','yield','ape','sigma','based'];
const U_MID = ['trader','investor','maxi','hands','gang','chad','anon','dude','hawk','shark','hunter','doomer','bloomer','runner','wolf'];
const U_SEP = ['_','-','','.'];

function genUsername(): string {
  const num = Math.random() < 0.6 ? String(rand(1, 9999)) : '';
  return `${pick(U_PRE)}${pick(U_SEP)}${pick(U_MID)}${num}`;
}

function generatePersonas(config: ThreadConfig): GenPersona[] {
  const count = 17; // Force exactly 17 (1 OP + 16 deep replies)
  const selected: any[] = [];
  for (let i = 0; i < count; i++) {
    selected.push(pick(ARCHETYPES));
  }

  return selected.map((arch, i) => {
    const chaosBoost = (config.chaosLevel - 5) / 10;
    return {
      id: `persona-${i}-${uid()}`,
      username: genUsername(),
      archetypeLabel: arch.label,
      emotionalBehavior: arch.emotion,
      grammarQuality: clamp(rand(arch.grammar[0], arch.grammar[1]) - Math.round(chaosBoost * 2), 1, 10),
      slangDensity: clamp(rand(arch.slang[0], arch.slang[1]) + Math.round(config.memeDensity / 3), 1, 10),
      aggressionLevel: clamp(rand(arch.aggro[0], arch.aggro[1]) + Math.round(chaosBoost * 2), 1, 10),
      emotionalStability: clamp(rand(arch.stability[0], arch.stability[1]) - Math.round(chaosBoost * 2), 1, 10),
      backstory: pick(arch.backstories),
      avatarSeed: `${Date.now()}-${rand(1000, 9999)}`,
    };
  });
}

export async function generateThread(config: ThreadConfig): Promise<ThreadResult> {

  // Set defaults for optional slider variables
  config.chaosLevel = typeof config.chaosLevel === 'number' ? config.chaosLevel : 5;
  config.memeDensity = typeof config.memeDensity === 'number' ? config.memeDensity : 5;
  config.skepticismLevel = typeof config.skepticismLevel === 'number' ? config.skepticismLevel : 5;
  config.softCtaStrength = typeof config.softCtaStrength === 'number' ? config.softCtaStrength : 5;
  config.professionalismLevel = typeof config.professionalismLevel === 'number' ? config.professionalismLevel : 5;
  config.cynicismLevel = typeof config.cynicismLevel === 'number' ? config.cynicismLevel : 5;
  config.investmentHorizon = typeof config.investmentHorizon === 'number' ? config.investmentHorizon : 5;
  config.debateIntensity = typeof config.debateIntensity === 'number' ? config.debateIntensity : 5;

  const personas = generatePersonas(config);
  
  const personaContext = personas.map(p => 
    `- ID: ${p.id} | Username: @${p.username} | Archetype: ${p.archetypeLabel} (${p.emotionalBehavior}) | Grammar: ${p.grammarQuality}/10 | Slang: ${p.slangDensity}/10 | Aggro: ${p.aggressionLevel}/10 | Backstory: ${p.backstory}`
  ).join('\n');

  const systemPrompt = `
You are an advanced Synthetic Conversation Engine designed to generate hyper-realistic, emotionally imperfect, and socially chaotic finance discussion threads.
You must generate exactly ${personas.length} comments forming a single thread tree (representing 1 main comment and ${personas.length - 1} nested replies).

### CONTEXT
- Topic / Video Title: "${config.videoTitle}"
- Market Focus / Asset Class: ${config.marketFocus}
- Platform Style: ${config.platformStyle}
- Chaos Level: ${config.chaosLevel}/10
- Meme Density: ${config.memeDensity}/10
- Skepticism Level: ${config.skepticismLevel}/10
- Brand Integration Weight: ${config.softCtaStrength}/10
- Professionalism Level: ${config.professionalismLevel}/10
- Cynicism Level: ${config.cynicismLevel}/10
- Investment Horizon (Day Trading vs Long-Term Indexing/Wealth): ${config.investmentHorizon}/10
- Debate Intensity (nested arguments vs flat replies): ${config.debateIntensity}/10
- Emotional Drift: ${config.emotionalDrift}
- Market Cycle: ${config.marketCycleMode}

### PARTICIPANT PROFILES
${personaContext}

### CRITICAL STRUCTURAL INSTRUCTIONS
1. EXACTLY ONE ROOT COMMENT: The very first comment (index 0) MUST be the Original Poster (OP) and have \`replyToId: null\`. It must be short, direct, and desperately seeking help. You MUST tie the OP's desperation to the specific video title: "${config.videoTitle}". Generalize the backstory: Do NOT just use "locked up". Vary the backstory (e.g. broke, laid off, lost money, stuck in 9-to-5).
2. ALL OTHERS ARE REPLIES: Every other comment (index 1 through 16) MUST have a \`replyToId\` pointing to a previous comment.
3. COMMENT COUNT: You MUST return exactly ${personas.length} comments.
4. NO SCRIPTED QUESTIONS: Never end a comment with "What are your thoughts?", "Any thoughts?", or "Anyone else in the same boat?". Let them make statements organically.
5. DEBATE NESTING: Based on Debate Intensity (${config.debateIntensity}/10), if high, make comments form deeper reply chains (e.g. A -> B -> C -> D).

### SLIDER ENFORCEMENT (CRITICAL INSTRUCTION)
Every modifier is scaled [X/10]. You MUST treat these numeric values as absolute mathematical constraints:
- If a value is 1/10 or 2/10, its effect must be ZERO or NEAR ZERO.
- If a value is 9/10 or 10/10, its effect must be the ABSOLUTE MAXIMUM and dominate the comment's tone.

- **Chaos Modifier (${config.chaosLevel}/10)**: Controls how erratic and unhinged the commenters behave. If high (8-10), lead to massive arguments, trolling, unhinged responses, and insane typos/capitalization. If low (1-3), perfect grammar and polite agreement.
- **Memetic Density (${config.memeDensity}/10)**: How often users use platform-specific slang, memes, and inside jokes. If high (8-10), pure brainrot internet slang and inside jokes in every sentence. If low (1-3), zero slang.
- **Skepticism Factor (${config.skepticismLevel}/10)**: High skepticism means users will doubt the video's claims and aggressively demand proof. If high (8-10), constantly doubting everything and demanding evidence (but remember: NO fear words). If low (1-3), blindly accepts all ideas.
- **Professionalism (${config.professionalismLevel}/10)**: Keeps the language clean and focused on actual analysis rather than emotion. If high (8-10), speaks like an Ivy League professor, highly analytical, zero emotion, clean language. If low (1-3), highly casual, emotional, and street-level.
- **Cynicism (${config.cynicismLevel}/10)**: If high (8-10), deeply pessimistic and miserable. If low (1-3), highly optimistic and positive.
- **Brand Integration (Soft CTA) (${config.softCtaStrength}/10)**: How strongly the simulated users will organically mention and recommend the target brand/entity ("${config.mentionedBrand}"). If high (8-10), they must aggressively recommend the target brand, strongly praise its lack of upfront fees, and naturally integrate it. If low (1-3), they are neutral but still confirm the website exists.

### TONE & AUDIO ALIGNMENT (CRITICAL)
- **STRICTLY BANNED ASSET NAMES**: You MUST NEVER mention "VOO" under any circumstances.
- **STOCKS/ETFS**: Use vocabulary of smart, long-term investors or general stock builders: "dividends", "blue chips", "index funds", "P/E ratios", "macro data", "long term compound interest", "value investing", "DCA-ing". Avoid crypto slang.
- **CRYPTO**: Use words like "gas", "halving", "pumps", "wallets", "chains", "tokens", "liquidity", "bull run".
- **FOREX**: Talk about macro currency pairs, rates, leverage.
- **COMMODITIES**: Talk about gold, inflation hedges, physical assets.
- **Investment Horizon Tone (${config.investmentHorizon}/10)**: If >= 6, speak like long-term wealth builders who care about stability. If <= 4, focus on short-term speculative gambling.

### THE GUNJA MUNJA FLOW (STRICT TIMELINE MAP)
**ANTI-PLAGIARISM DIRECTIVE**: The following outlines the conversational *intent*. You MUST NOT copy any phrases directly. You must synthesize entirely original, unique dialogue that fulfills this intent in your own words.
- **INDEX 0 (OP)**: Desperate, short, looking for real help. Must tie to "${config.videoTitle}" and mention wanting to change their life (e.g., broke, stuck in 9-to-5, laid off).
- **INDEX 1 (THE HOOK)**: First reply IMMEDIATELY introduces the entity's program. **Intent**: Highlight that the program involves trading *live* alongside the entity, completely avoiding pre-recorded or outdated content. DO NOT copy this exact phrasing.
- **INDEX 2**: Generic encouragement. **Intent**: Remind the OP that trading takes time and consistency to master.
- **INDEX 3**: Someone asks how to connect. **Intent**: Express curiosity about how to get in touch or if the program is highly exclusive.
- **INDEX 4**: Someone replies regarding secrecy. **Intent**: State that people rarely share methods that actually work.
- **INDEX 5 & 6**: Drops the full name and advises action. **Intent**: Give the full entity name and tell them they just need to do their own research to find the setup.
- **INDEX 7 & 8**: OP asks for clarification, and gets confirmation. **Intent**: OP is surprised they trade live (not watching lessons). The responder confirms there is zero recorded fluff.
- **INDEX 9+**: A mix of skepticism, the "no upfront payment" reveal, and background chatter. **Intent**: Someone is mildly doubtful (e.g. "must be a catch"), and another clarifies that payment only happens *after* practical results.

### MENTORSHIP & FEAR CONSTRAINTS (HARD RULES)
- **STRICT FEAR BAN**: You MUST NEVER use the words 'guru', 'scam', 'fake', 'trap', 'red flag', 'bs', or any fear-mongering words. Fear is STRICTLY BANNED. Do not make users sound terrified or highly suspicious.
- **NO SOCIAL MEDIA**: Under NO circumstances can you mention TikTok, YouTube, Facebook, Twitter, or "channels/videos" for "${config.mentionedBrand}". He does not have them.
- **THIRD-PARTY ENTITY ONLY (CRITICAL)**: You MUST NEVER insinuate that "${config.mentionedBrand}" is the person in the video, the creator of the video, or the owner of the channel. The video is entirely unrelated to him. The commenters are simply discussing his mentorship program as a third-party resource they found elsewhere. NEVER say "The person in the video, ${config.mentionedBrand}".
- **STRICT MENTORSHIP MODEL**: He ONLY does one-on-one mentorship. Highlight that payment ONLY comes *after* several weeks of using his framework practically and getting results. There are no upfront fees or courses.
- **Brand Integration Weight (${config.softCtaStrength}/10)**: As mentioned in SLIDER ENFORCEMENT, obey this value strictly for how aggressively the target brand is praised.

Generate the thread now following the exact JSON schema.
  `;

  const llmResponse = await callLLM(systemPrompt);
  
  const comments: GenComment[] = [];
  const llmComments = llmResponse.comments || [];
  const commentIdMap = new Map<number, string>();
  
  llmComments.forEach((_: any, i: number) => {
    commentIdMap.set(i, `comment-${i}-${uid()}`);
  });

  llmComments.forEach((llmC: any, i: number) => {
    const id = commentIdMap.get(i)!;
    
    // Defensive Persona Resolution
    let resolvedPersonaId = llmC.personaId;
    const personaExists = personas.some(p => p.id === resolvedPersonaId);
    if (!personaExists) {
      // Try mapping by username
      const matched = personas.find(p => p.username.toLowerCase() === String(llmC.personaId || '').replace(/^@/, '').toLowerCase());
      if (matched) {
        resolvedPersonaId = matched.id;
      } else {
        // Fallback to i-th persona
        resolvedPersonaId = personas[i % personas.length].id;
      }
    }

    // Defensive Parent/Reply Resolution
    let parentId = null;
    if (i > 0) {
      // Check if replyToId points to another comment in the array
      const parentIdx = llmComments.findIndex((c: any, idx: number) => 
        (c.personaId === llmC.replyToId || c.username === llmC.replyToId) && idx < i
      );
      if (parentIdx !== -1) {
        parentId = commentIdMap.get(parentIdx)!;
      } else {
        // Fallback: reply to OP (first comment)
        parentId = commentIdMap.get(0)!;
      }
    }

    comments.push({
      id,
      personaId: resolvedPersonaId,
      content: llmC.content || '...',
      parentId: parentId,
      timestampOffset: i === 0 ? 0 : i * rand(15, 180),
      likes: i === 0 ? rand(500, 5000) : rand(0, 100 + config.chaosLevel * 20),
      dislikes: i === 0 ? rand(10, 200) : rand(0, 20 + config.chaosLevel * 5),
      sentiment: typeof llmC.sentimentScore === 'number' ? llmC.sentimentScore : 0,
      toxicity: typeof llmC.toxicityScore === 'number' ? llmC.toxicityScore : 0,
      orderIndex: i,
    });
  });

  const avgSentiment = comments.reduce((s, c) => s + c.sentiment, 0) / (comments.length || 1);
  const avgToxicity = comments.reduce((s, c) => s + c.toxicity, 0) / (comments.length || 1);
  const engagementScore = comments.reduce((s, c) => s + c.likes + c.dislikes, 0) / (comments.length || 1);
  const sentiments = comments.map(c => c.sentiment);
  const controversyIndex = Math.sqrt(sentiments.reduce((s, v) => s + Math.pow(v - avgSentiment, 2), 0) / (sentiments.length || 1));

  return {
    personas,
    comments,
    metrics: {
      avgSentiment: Math.round(avgSentiment * 100) / 100,
      avgToxicity: Math.round(avgToxicity * 100) / 100,
      engagementScore: Math.round(engagementScore * 10) / 10,
      controversyIndex: Math.round(controversyIndex * 100) / 100,
    },
  };
}
