import * as googleTTS from 'google-tts-api';
import fs from 'fs';
import path from 'path';

/**
 * VOICE GENERATION SERVICE
 * Uses google-tts-api for totally free voice generation.
 */

export async function generateSpeech(text: string, projectId: string, slideIndex: number | string = 'main'): Promise<string> {
   console.log(`[Voice] Synthesizing speech for ${projectId} (slide ${slideIndex}): "${text.substring(0, 30)}..."`);
   
   const assetsDir = path.join(process.cwd(), 'public', 'assets', 'audio');
   if (!fs.existsSync(assetsDir)) {
       fs.mkdirSync(assetsDir, { recursive: true });
   }

   const fileName = `${projectId}_voice_${slideIndex}.mp3`;
   const filePath = path.join(assetsDir, fileName);

   try {
       const results = await googleTTS.getAllAudioBase64(text, {
           lang: 'en',
           slow: false,
           host: 'https://translate.google.com',
           timeout: 10000,
       });

       const mergedBuffer = Buffer.concat(
           results.map(res => Buffer.from(res.base64, 'base64'))
       );

       fs.writeFileSync(filePath, mergedBuffer);
       console.log(`[Voice] Saved audio to ${filePath}`);
       
       return `/assets/audio/${fileName}`;
   } catch (error) {
       console.error('[Voice] TTS synthesis failed:', error);
       throw error;
   }
}

export async function generateBackgroundMusic(intensity: 'high' | 'low'): Promise<string> {
    // Return a path to a royalty-free track
    return `assets/music/cyberpunk_drive_${intensity}.mp3`;
}

