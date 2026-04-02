import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api/response";
import { requireUser } from "@/lib/api/auth-guard";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const [
    alloyCount,
    arcCount,
    spinCount,
    sampleCount,
    imageCount,
    testCount,
    latestSamples,
    latestImages,
    latestTests
  ] = await Promise.all([
    prisma.alloyDesign.count(),
    prisma.arcMeltingBatch.count(),
    prisma.spinningBatch.count(),
    prisma.sample.count(),
    prisma.imageAsset.count(),
    prisma.testRecord.count(),
    prisma.sample.findMany({
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.imageAsset.findMany({
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.testRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { sample: true }
    })
  ]);

  return ok({
    alloyCount,
    arcCount,
    spinCount,
    sampleCount,
    imageCount,
    testCount,
    latestSamples,
    latestImages,
    latestTests
  });
}

