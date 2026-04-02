import { prisma } from "@/lib/prisma";

function extractMax(sequence: string[], prefix: string) {
  return sequence.reduce((max, code) => {
    const value = Number(code.replace(prefix, ""));
    if (Number.isNaN(value)) return max;
    return value > max ? value : max;
  }, 0);
}

export async function nextAlloyCode() {
  const rows = await prisma.alloyDesign.findMany({
    select: { code: true }
  });
  const max = extractMax(rows.map((x) => x.code), "H");
  return `H${max + 1}`;
}

export async function nextTestRecordNo() {
  const rows = await prisma.testRecord.findMany({
    select: { recordNo: true }
  });
  const max = extractMax(rows.map((x) => x.recordNo), "T");
  return `T${String(max + 1).padStart(3, "0")}`;
}

