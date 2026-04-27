import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.OPENROUTER_API_KEY;

export interface NarrationScript {
  title: string;
  thumbnailText: string;
  hook: string;
  explanation: string;
  impact: string;
  remediation: string;
  outro: string;
  slides: {
    title: string;
    description: string;
    visualHint: string;
    type: 'ALERT' | 'TECHNICAL' | 'IMPACT' | 'CODE' | 'OUTRO';
  }[];
}

export async function generateNarration(cve: any): Promise<NarrationScript> {
  const prompt = `
You are the world's leading cybersecurity content creator for the YouTube channel "CVE Explained". Your audience loves high-stakes, fast-paced, and technically accurate but dramatic breakdowns.

Vulnerability Target:
CVE ID: ${cve.cveId}
Title: ${cve.title}
Raw Data: ${cve.description}

MISSION: Prepare a viral 60-second video script (Shorts/TikTok style).
STYLE: Intense, Matrix-vibe, apocalyptic but educational.

Required JSON Structure:
{
  "title": "A short, clickbaity video title",
  "thumbnailText": "3-4 punchy words for a thumbnail (e.g., 'YOUR PC IS VULNERABLE')",
  "hook": "5 second high-energy intro sentence",
  "explanation": "Clear, fast-paced technical breakdown of the exploit",
  "impact": "The terrifying real-world consequences",
  "remediation": "The exact steps to secure systems",
  "outro": "Call to action: 'Patch now. Security is not optional.'",
  "slides": [
    {
      "title": "Short slide header",
      "description": "The exact words spoken during this slide",
      "visualHint": "Instruction for the forge: e.g., 'Flashing red code', 'System failure overlay'",
      "type": "ALERT | TECHNICAL | IMPACT | CODE | OUTRO"
    }
  ]
}

Only output the raw JSON. Use DeepSeek R1 reasoning to ensure the technical parts are correct while being engaging.
`;

  try {
    const response = await axios.post(OPENROUTER_API_URL, {
      model: 'deepseek/deepseek-r1:free', // Use R1 for deep reasoning
      messages: [
        { role: 'system', content: 'You are a cybersecurity expert and dramatic scriptwriter. Output ONLY raw JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('[Narration] Failed to generate script:', error);
    throw error;
  }
}
