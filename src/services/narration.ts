import { GoogleGenAI, Type } from '@google/genai';

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

Only output the raw JSON.
`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            thumbnailText: { type: Type.STRING },
            hook: { type: Type.STRING },
            explanation: { type: Type.STRING },
            impact: { type: Type.STRING },
            remediation: { type: Type.STRING },
            outro: { type: Type.STRING },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  visualHint: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['ALERT', 'TECHNICAL', 'IMPACT', 'CODE', 'OUTRO'] }
                },
                required: ['title', 'description', 'visualHint', 'type']
              }
            }
          },
          required: ['title', 'thumbnailText', 'hook', 'explanation', 'impact', 'remediation', 'outro', 'slides']
        }
      }
    });

    const content = response.text();
    if (!content) {
      throw new Error('No content returned from AI');
    }
    return JSON.parse(content);
  } catch (error) {
    console.error('[Narration] Failed to generate script:', error);
    throw new Error(\`Failed to generate narration script: \${error instanceof Error ? error.message : String(error)}\`);
  }
}
