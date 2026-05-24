// @ts-nocheck
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      // Strip quotes
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      process.env[key] = val;
    }
  });
}

import { generateThread } from './src/lib/engine';

async function test() {
  console.log("Running engine directly...");
  try {
    const result = await generateThread({
      videoTitle: '"Why Most Retail Investors Lose Money" - The REAL Truth',
      marketFocus: 'stocks',
      platformStyle: 'youtube',
      mentionedBrand: 'WallStreetBets',
      chaosLevel: 5,
      memeDensity: 5,
      skepticismLevel: 5,
      softCtaStrength: 5,
      professionalismLevel: 5,
      cynicismLevel: 5,
      investmentHorizon: 5,
      debateIntensity: 5,
      emotionalDrift: 'mixed',
      marketCycleMode: 'sideways boredom',
    });
    console.log("SUCCESS!");
    console.log("Personas:", result.personas.length);
    console.log("Comments:", result.comments.length);
    console.log("Metrics:", result.metrics);
  } catch (err: any) {
    console.error("ENGINE FAILED DIRECTLY:");
    console.error(err.stack || err);
  }
}

test();
