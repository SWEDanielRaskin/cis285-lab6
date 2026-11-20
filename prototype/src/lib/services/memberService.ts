import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { MemberView } from "@/lib/types";
import { NotFoundError, ValidationError } from "./errors";
import { requireObject, requireText } from "./validation";

export const MEMBER_NAME_MAX = 50;

/** FR2: add a member to a group. Names are unique within a group, ignoring case. */
export async function addMember(groupId: string, body: unknown): Promise<MemberView> {
  const input = requireObject(body);
  const name = requireText(input.name, "name", "Member name", MEMBER_NAME_MAX);
  const nameKey = name.toLowerCase();

  try {
    const member = await prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({ where: { id: groupId }, select: { id: true } });
      if (!group) {
        throw new NotFoundError("Group not found.");
      }
      const existing = await tx.member.findUnique({
        where: { groupId_nameKey: { groupId, nameKey } },
      });
      if (existing) {
        throw new ValidationError(`"${existing.name}" is already a member of this group.`, "name");
      }
      return tx.member.create({ data: { groupId, name, nameKey } });
    });
    return { id: member.id, name: member.name, createdAt: member.createdAt.toISOString() };
  } catch (err) {
    // A second request with the same name can slip past the check above;
    // the unique index still stops it.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ValidationError(`"${name}" is already a member of this group.`, "name");
    }
    throw err;
  }
}
