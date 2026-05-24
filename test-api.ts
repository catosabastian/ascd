// @ts-nocheck
async function test() {
  console.log('--- Testing ThreadForge API ---');

  // Test GET /api/threads
  try {
    const r1 = await fetch('http://localhost:3000/api/threads');
    console.log('GET /api/threads:', r1.status);
    const d1 = await r1.json();
    console.log('Runs:', d1.runs?.length ?? 'error');
  } catch (e: any) { console.error('GET failed:', e.message); }

  // Test POST /api/generate
  try {
    const r2 = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoTitle: '"Why Most Retail Investors Lose Money" - The REAL Truth',
        marketFocus: 'stocks',
        platformStyle: 'youtube',
        mentionedBrand: 'WallStreetBets',
        chaosLevel: 7,
        memeDensity: 6,
        skepticismLevel: 7,
        softCtaStrength: 4,
        emotionalDrift: 'frustrated',
        marketCycleMode: 'chop',
      }),
    });
    console.log('POST /api/generate:', r2.status);
    const d2 = await r2.json();
    if (d2.success) {
      console.log('✅ Personas:', d2.personas.length);
      console.log('✅ Comments:', d2.comments.length);
      console.log('✅ Metrics:', JSON.stringify(d2.metrics));
      console.log('\n--- Sample comments ---');
      d2.comments.slice(0, 3).forEach((c: any) => {
        const p = d2.personas.find((pp: any) => pp.id === c.personaId);
        console.log(`[@${p?.username}] ${c.content}\n`);
      });
    } else {
      console.log('❌ Error:', JSON.stringify(d2));
    }
  } catch (e: any) { console.error('POST failed:', e.message); }
}
test();
