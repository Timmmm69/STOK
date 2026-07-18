import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { reportApplicationError } from "../../../composition/logging";
import { getSetupForRequest, initializeSetupForRequest } from "../../../composition/setup";
import { SetupConflictError } from "../../../modules/organizations";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const result = await getSetupForRequest(request.headers);
    if (!result) {
      return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
    }

    return NextResponse.json(result.setup);
  } catch (error) {
    reportApplicationError("setup.read.failed", error);
    return NextResponse.json({ error: "Не удалось загрузить настройки" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  const idempotencyKey = request.headers.get("idempotency-key") ?? "";

  try {
    const input: unknown = await request.json();
    const setup = await initializeSetupForRequest(request.headers, input, idempotencyKey);
    if (!setup) {
      return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
    }

    return NextResponse.json(setup, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Введите название магазина длиной от 1 до 120 символов" },
        { status: 400 },
      );
    }
    if (error instanceof SetupConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    reportApplicationError("setup.initialize.failed", error);
    return NextResponse.json({ error: "Не удалось сохранить настройки" }, { status: 500 });
  }
}
