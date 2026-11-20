import { handle, readJson } from "@/lib/http";
import { recordExpense } from "@/lib/services/expenseService";
import { getGroupDetail } from "@/lib/services/groupService";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ groupId: string }> };

// GET /api/groups/:groupId/expenses -> ExpenseView[] (newest first)
export async function GET(_request: Request, { params }: Params) {
  const { groupId } = await params;
  return handle(async () => (await getGroupDetail(groupId)).expenses);
}

// POST /api/groups/:groupId/expenses
//   { description, amount: "60.00", payerId, participantIds: [...] } -> ExpenseView
export async function POST(request: Request, { params }: Params) {
  const { groupId } = await params;
  return handle(async () => recordExpense(groupId, await readJson(request)), 201);
}
