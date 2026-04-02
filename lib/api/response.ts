import { NextResponse } from "next/server";

export function ok<T>(data: T, message = "ok", status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function fail(
  message: string,
  status = 400,
  errors?: Record<string, string | string[] | undefined>
) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors
    },
    { status }
  );
}
