import { handle } from "@/lib/http";
import { getGroupDetail } from "@/lib/services/groupService";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ groupId: string }> };

// GET /api/groups/:groupId/balances -> { balances, balanceSumCents, settlements }
export async function GET(_request: Request, { params }: Params) {
  const { groupId } = await params;
  return handle(async () => {
    const { balances, balanceSumCents, settlements } = await getGroupDetail(groupId);
    return { balances, balanceSumCents, settlements };
  });
}
