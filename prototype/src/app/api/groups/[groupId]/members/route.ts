import { handle, readJson } from "@/lib/http";
import { getGroupDetail } from "@/lib/services/groupService";
import { addMember } from "@/lib/services/memberService";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ groupId: string }> };

// GET /api/groups/:groupId/members -> MemberView[]
export async function GET(_request: Request, { params }: Params) {
  const { groupId } = await params;
  return handle(async () => (await getGroupDetail(groupId)).members);
}

// POST /api/groups/:groupId/members { name } -> MemberView
export async function POST(request: Request, { params }: Params) {
  const { groupId } = await params;
  return handle(async () => addMember(groupId, await readJson(request)), 201);
}
