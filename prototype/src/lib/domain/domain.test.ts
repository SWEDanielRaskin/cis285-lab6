import { describe, expect, it } from "vitest";
import { calculateBalances, suggestSettlements } from "./balances";
import { formatCents, formatSignedCents, parseAmountToCents } from "./money";
import { allocateEqualSplit } from "./split";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("parseAmountToCents", () => {
  it.each([
    ["60", 6000],
    ["60.00", 6000],
    ["10", 1000],
    ["0.01", 1],
    ["12.5", 1250],
    [" $7.25 ", 725],
    ["1000000.00", 100_000_000],
    [60, 6000],
    [0.1, 10],
  ])("parses %j as %i cents", (input, cents) => {
    expect(parseAmountToCents(input)).toEqual({ ok: true, cents });
  });

  it.each([
    ["", "Amount is required."],
    [undefined, "Amount is required."],
    ["0", "Amount must be greater than zero."],
    ["0.00", "Amount must be greater than zero."],
    ["-5", "Amount must be greater than zero."],
    [-5, "Amount must be greater than zero."],
    ["abc", "Amount must be a number such as 12.50."],
    ["1e3", "Amount must be a number such as 12.50."],
    ["1,000", "Amount must be a number such as 12.50."],
    ["10.005", "Amount can have at most two decimal places."],
    [0.1 + 0.2, "Amount can have at most two decimal places."],
    ["1000000.01", "Amount cannot be more than $1,000,000.00."],
    ["99999999999999999999", "Amount cannot be more than $1,000,000.00."],
    [Number.NaN, "Amount must be a number such as 12.50."],
    [true, "Amount must be a number such as 12.50."],
  ])("rejects %j", (input, error) => {
    expect(parseAmountToCents(input)).toEqual({ ok: false, error });
  });
});

describe("formatCents", () => {
  it("formats positive, negative and zero values", () => {
    expect(formatCents(4000)).toBe("$40.00");
    expect(formatCents(-2000)).toBe("-$20.00");
    expect(formatCents(333)).toBe("$3.33");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(123456789)).toBe("$1,234,567.89");
    expect(formatSignedCents(4000)).toBe("+$40.00");
    expect(formatSignedCents(-2000)).toBe("-$20.00");
    expect(formatSignedCents(0)).toBe("$0.00");
  });
});

describe("allocateEqualSplit", () => {
  it("splits $60 three ways evenly", () => {
    expect(allocateEqualSplit(6000, ["a", "b", "c"]).map((s) => s.amountCents)).toEqual([2000, 2000, 2000]);
  });

  it("splits $10 three ways to the cent, extra cent to the first listed", () => {
    const shares = allocateEqualSplit(1000, ["a", "b", "c"]);
    expect(shares).toEqual([
      { memberId: "a", position: 0, amountCents: 334 },
      { memberId: "b", position: 1, amountCents: 333 },
      { memberId: "c", position: 2, amountCents: 333 },
    ]);
    expect(sum(shares.map((s) => s.amountCents))).toBe(1000);
  });

  it("gives leftover cents in listed order, so order decides who gets them", () => {
    expect(allocateEqualSplit(1000, ["c", "a", "b"])[0]).toEqual({ memberId: "c", position: 0, amountCents: 334 });
    expect(allocateEqualSplit(2, ["a", "b", "c"]).map((s) => s.amountCents)).toEqual([1, 1, 0]);
  });

  it("always totals the amount", () => {
    for (let amount = 1; amount <= 2000; amount += 7) {
      for (let n = 1; n <= 9; n++) {
        const ids = Array.from({ length: n }, (_, i) => `m${i}`);
        const shares = allocateEqualSplit(amount, ids).map((s) => s.amountCents);
        expect(sum(shares)).toBe(amount);
        expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("rejects bad input", () => {
    expect(() => allocateEqualSplit(0, ["a"])).toThrow();
    expect(() => allocateEqualSplit(-100, ["a"])).toThrow();
    expect(() => allocateEqualSplit(10.5, ["a"])).toThrow();
    expect(() => allocateEqualSplit(100, [])).toThrow();
    expect(() => allocateEqualSplit(100, ["a", "a"])).toThrow();
  });
});

describe("calculateBalances", () => {
  const members = [
    { id: "alice", name: "Alice" },
    { id: "bob", name: "Bob" },
    { id: "charlie", name: "Charlie" },
  ];
  const expense = (payerId: string, amountCents: number, ids: string[]) => ({
    payerId,
    amountCents,
    shares: allocateEqualSplit(amountCents, ids),
  });

  it("gives the FR5 example: Alice pays $60 for three", () => {
    const result = calculateBalances(members, [expense("alice", 6000, ["alice", "bob", "charlie"])]);
    expect(result.map((b) => [b.name, b.balanceCents])).toEqual([
      ["Alice", 4000],
      ["Bob", -2000],
      ["Charlie", -2000],
    ]);
  });

  it("accumulates several expenses and still sums to zero", () => {
    const result = calculateBalances(members, [
      expense("alice", 6000, ["alice", "bob", "charlie"]),
      expense("bob", 3000, ["alice", "bob", "charlie"]),
      expense("charlie", 1000, ["alice", "bob", "charlie"]),
    ]);
    // Alice +40 -10 -3.34 = 26.66 ; Bob -20 +20 -3.33 = -3.33 ; Charlie -20 -10 +6.67 = -23.33
    expect(result.map((b) => b.balanceCents)).toEqual([2666, -333, -2333]);
    expect(sum(result.map((b) => b.balanceCents))).toBe(0);
  });

  it("handles a payer who is not a participant", () => {
    const result = calculateBalances(members, [expense("alice", 1000, ["bob", "charlie"])]);
    expect(result.map((b) => b.balanceCents)).toEqual([1000, -500, -500]);
  });

  it("gives zero balances when there are no expenses", () => {
    expect(calculateBalances(members, []).map((b) => b.balanceCents)).toEqual([0, 0, 0]);
  });

  it("refuses expenses that reference a non-member or whose shares do not add up", () => {
    expect(() => calculateBalances(members, [expense("zoe", 1000, ["alice"])])).toThrow(/not in this group/);
    expect(() =>
      calculateBalances(members, [{ payerId: "alice", amountCents: 1000, shares: [{ memberId: "bob", amountCents: 999 }] }]),
    ).toThrow(/do not add up/);
  });
});

describe("suggestSettlements", () => {
  it("settles the FR5 example with two payments to Alice", () => {
    const balances = calculateBalances(
      [
        { id: "alice", name: "Alice" },
        { id: "bob", name: "Bob" },
        { id: "charlie", name: "Charlie" },
      ],
      [{ payerId: "alice", amountCents: 6000, shares: allocateEqualSplit(6000, ["alice", "bob", "charlie"]) }],
    );
    expect(suggestSettlements(balances)).toEqual([
      { fromMemberId: "bob", toMemberId: "alice", amountCents: 2000 },
      { fromMemberId: "charlie", toMemberId: "alice", amountCents: 2000 },
    ]);
  });
});
