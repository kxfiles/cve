import { prisma } from '../lib/prisma';
import { generateNarration } from '../services/narration';
import { generateSpeech } from './voice';

export async function produceVideo(cveId: string) {
  const cve = await prisma.cve.findUnique({
    where: { cveId }
  });

  if (!cve) throw new Error('CVE not found');

  // 1. Create project
  const project = await prisma.project.create({
    data: {
      cveId: cve.cveId,
      title: `CVE Explained: ${cve.cveId}`,
      status: 'GENERATING'
    }
  });

  try {
    console.log(`[Producer] Generating viral script for ${cve.cveId}...`);
    const script = await generateNarration(cve);

    console.log(`[Producer] Generating audio for ${cve.cveId} slides...`);
    const slideAssets = [];
    for (let i = 0; i < script.slides.length; i++) {
        const slide = script.slides[i];
        const audioPath = await generateSpeech(slide.description, project.id, i.toString());
        slideAssets.push({
            ...slide,
            audioPath
        });
    }

    const assets = {
      slides: slideAssets,
      thumbnail: {
        text: script.thumbnailText,
        layout: 'V1_IMPACT'
      }
    };

    await prisma.project.update({
      where: { id: project.id },
      data: {
        title: script.title,
        script: JSON.stringify(script),
        assets: JSON.stringify(assets),
        status: 'READY'
      }
    });

    console.log(`[Producer] Autonomous production complete for ${cve.cveId}. Ready for Forge.`);
    return project.id;
  } catch (error) {
    console.error(`[Producer] Production failed for ${cve.cveId}:`, error);
    await prisma.project.update({
      where: { id: project.id },
      data: { 
        status: 'FAILED',
        errorReason: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  }
}

