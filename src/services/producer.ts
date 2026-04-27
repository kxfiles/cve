import { PrismaClient } from '@prisma/client';
import { pollVulnerabilities } from '../lib/autonomous/cve-sentinel';
import { generateNarration } from '../services/narration';

const prisma = new PrismaClient();

export async function produceVideo(cveId: string) {
  const cve = await prisma.cve.findUnique({
    where: { cveId }
  });

  if (!cve) throw new Error('CVE not found');

  // 1. Create project
  const project = await prisma.project.create({
    data: {
      cveId: cve.cveId,
      title: `Episode: ${cve.cveId}`,
      status: 'GENERATING'
    }
  });

  try {
    // 2. Generate Narration Script
    console.log(`[Producer] Generating script for ${cve.cveId}...`);
    const script = await generateNarration(cve);

    // 3. Store script and initial assets
    await prisma.project.update({
      where: { id: project.id },
      data: {
        script: JSON.stringify(script),
        assets: JSON.stringify(script.slides),
        status: 'READY' // For now, we mark as ready when script is done
      }
    });

    console.log(`[Producer] Project ${project.id} is ready for rendering.`);
    return project.id;
  } catch (error) {
    await prisma.project.update({
      where: { id: project.id },
      data: { status: 'FAILED' }
    });
    throw error;
  }
}
