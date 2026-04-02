import { SampleState } from "@prisma/client";

function toMMDD(value: Date) {
  const d = new Date(value);
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${mm}${dd}`;
}

export function buildArcBatchNo(date: Date) {
  return `M${toMMDD(date)}`;
}

export function buildSpinningBatchNo(date: Date) {
  return `L${toMMDD(date)}`;
}

export function buildSampleNo(sampleIndex: number) {
  return `S${sampleIndex.toString().padStart(3, "0")}`;
}

type DisplayNamePayload = {
  alloyCode: string;
  arcBatchNo: string;
  spinBatchNo: string;
  state: SampleState;
  bareWireDiameterUm: number;
  treatmentCode: string;
  sampleIndex: number;
};

export function buildDisplayName(payload: DisplayNamePayload) {
  return [
    payload.alloyCode,
    payload.arcBatchNo,
    payload.spinBatchNo,
    `${payload.state}${Math.round(payload.bareWireDiameterUm)}`,
    payload.treatmentCode,
    payload.sampleIndex
  ].join("-");
}

