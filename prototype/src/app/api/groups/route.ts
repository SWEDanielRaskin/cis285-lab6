import { handle, readJson } from "@/lib/http";
import { createGroup, listGroups } from "@/lib/services/groupService";

export const dynamic = "force-dynamic";

// GET /api/groups -> GroupSummary[]
export async function GET() {
  return handle(() => listGroups());
}

// POST /api/groups { name } -> GroupSummary
export async function POST(request: Request) {
  return handle(async () => createGroup(await readJson(request)), 201);
}
