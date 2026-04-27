import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.OPENROUTER_API_KEY;

export interface NarrationScript {
  title: string;
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
You are the scriptwriter for "CVE Explained", a YouTube channel that covers critical cybersecurity vulnerabilities with intense, dramatic, and educational flair.

Vulnerability Details:
CVE ID: ${cve.cveId}
Title: ${cve.title}
Description: ${cve.description}
Source: ${cve.source}

Generate a high-intensity narration script for a 60-second video (Shorts format).
The script should include:
1. A dramatic hook.
2. A technical explanation simplified for a general tech audience.
3. The real-world impact.
4. How to fix it.

Also, provide a sequence of "Slides" for the video. Each slide needs a title, description, and a visual instruction (e.g., "Matrix rain background", "Red flashing alert", "Code snippet showing the overflow").

Return the result as a raw JSON object matching this TypeScript interface:
interface NarrationScript {
  title: string;
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
