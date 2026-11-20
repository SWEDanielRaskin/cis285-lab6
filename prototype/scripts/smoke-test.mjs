// End-to-end API test for the SplitSmart prototype.
// Runs against a live server and writes real rows to the database.
//
//   npm run dev                      (in one terminal)
//   npm run smoke                    (in another)
//   npm run smoke -- --check <id>    (after restarting the server: is the data still there?)
//
// BASE_URL defaults to http://localhost:3000.

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail === undefined ? "" : `\n        got: ${JSON.stringify(detail)}`}`);
  }
}

async function call(method, path, body, { raw } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, body: json };
}

const balancesOf = (detail) => Object.fromEntries(detail.balances.map((b) => [b.name, b.balanceCents]));
const sumOf = (detail) => detail.balances.reduce((s, b) => s + b.balanceCents, 0);

async function persistenceCheck(groupId) {
  console.log(`\nPersistence check for group ${groupId}`);
  const { status, body } = await call("GET", `/api/groups/${groupId}`);
  check("group still exists after server restart", status === 200, status);
  if (status !== 200) return;
  check("3 members still present", body.members.length === 3, body.members.length);
  check("3 expenses still present", body.expenses.length === 3, body.expenses.length);
  const b = balancesOf(body);
  check(
    "balances unchanged (Alice +26.66, Bob -3.33, Charlie -23.33)",
    b.Alice === 2666 && b.Bob === -333 && b.Charlie === -2333,
    b,
  );
  check("balances still sum to zero", sumOf(body) === 0, sumOf(body));
}

async function fullRun() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  console.log("\n1. Create a group");
  const g = await call("POST", "/api/groups", { name: `Roommates ${stamp}` });
  check("POST /api/groups returns 201", g.status === 201, g);
  const groupId = g.body.id;
  const list = await call("GET", "/api/groups");
  check("new group appears in the group list", list.body.some((x) => x.id === groupId));

  console.log("\n2. Add three members");
  const ids = {};
  for (const name of ["Alice", "Bob", "Charlie"]) {
    const r = await call("POST", `/api/groups/${groupId}/members`, { name });
    check(`add ${name} returns 201`, r.status === 201, r);
    ids[name] = r.body.id;
  }
  const members = await call("GET", `/api/groups/${groupId}/members`);
  check("member list has 3 members in order", members.body.map((m) => m.name).join() === "Alice,Bob,Charlie", members.body);
  const dup = await call("POST", `/api/groups/${groupId}/members`, { name: "  alice " });
  check("duplicate member name (case-insensitive) rejected with 400", dup.status === 400, dup);
  console.log(`        message: ${dup.body?.error}`);
  const all = [ids.Alice, ids.Bob, ids.Charlie];

  console.log("\n3. $60 paid by Alice, shared by all three");
  const e1 = await call("POST", `/api/groups/${groupId}/expenses`, {
    description: "Dinner",
    amount: "60.00",
    payerId: ids.Alice,
    participantIds: all,
  });
  check("expense recorded (201)", e1.status === 201, e1);
  check("shares are $20.00 each", e1.body.shares.every((s) => s.amountCents === 2000), e1.body.shares);
  let d = (await call("GET", `/api/groups/${groupId}`)).body;
  let b = balancesOf(d);
  check("Alice +$40.00, Bob -$20.00, Charlie -$20.00", b.Alice === 4000 && b.Bob === -2000 && b.Charlie === -2000, b);
  check("balances sum to zero", sumOf(d) === 0 && d.balanceSumCents === 0, sumOf(d));

  console.log("\n4. Multiple expenses update balances");
  await call("POST", `/api/groups/${groupId}/expenses`, {
    description: "Groceries",
    amount: "30",
    payerId: ids.Bob,
    participantIds: all,
  });
  const e3 = await call("POST", `/api/groups/${groupId}/expenses`, {
    description: "Snacks",
    amount: "10.00",
    payerId: ids.Charlie,
    participantIds: all,
  });
  check("third expense recorded (201)", e3.status === 201, e3);
  d = (await call("GET", `/api/groups/${groupId}`)).body;
  b = balancesOf(d);
  // Alice: +40 -10 -3.34 = +26.66   Bob: -20 +20 -3.33 = -3.33   Charlie: -20 -10 +6.67 = -23.33
  check("Alice +$26.66, Bob -$3.33, Charlie -$23.33", b.Alice === 2666 && b.Bob === -333 && b.Charlie === -2333, b);
  check("balances sum to zero", sumOf(d) === 0, sumOf(d));
  check("history lists 3 expenses, newest first", d.expenses.map((e) => e.description).join() === "Snacks,Groceries,Dinner", d.expenses.map((e) => e.description));

  console.log("\n5. $10 shared by three, allocated to the cent (separate group)");
  const g2 = (await call("POST", "/api/groups", { name: `Ten dollar test ${stamp}` })).body;
  const ids2 = [];
  for (const name of ["Alice", "Bob", "Charlie"]) {
    ids2.push((await call("POST", `/api/groups/${g2.id}/members`, { name })).body.id);
  }
  const ten = await call("POST", `/api/groups/${g2.id}/expenses`, {
    description: "Coffee",
    amount: "10",
    payerId: ids2[0],
    participantIds: ids2,
  });
  const shares = ten.body.shares.map((s) => s.amountCents);
  check("shares are $3.34, $3.33, $3.33 (extra cent to first listed)", shares.join() === "334,333,333", shares);
  check("shares total exactly $10.00", shares.reduce((a, c) => a + c, 0) === 1000);
  const d2 = (await call("GET", `/api/groups/${g2.id}`)).body;
  const b2 = balancesOf(d2);
  check("Alice +$6.66, Bob -$3.33, Charlie -$3.33", b2.Alice === 666 && b2.Bob === -333 && b2.Charlie === -333, b2);
  check("balances sum to zero", sumOf(d2) === 0, sumOf(d2));

  console.log("\n6. Invalid amounts are rejected");
  const before = (await call("GET", `/api/groups/${groupId}`)).body.expenses.length;
  for (const amount of ["0", "0.00", "-5", "abc", "10.005", "", "1000000.01", null]) {
    const r = await call("POST", `/api/groups/${groupId}/expenses`, {
      description: "Bad",
      amount,
      payerId: ids.Alice,
      participantIds: all,
    });
    check(`amount ${JSON.stringify(amount)} -> 400 (field=amount)`, r.status === 400 && r.body.field === "amount", r);
    console.log(`        message: ${r.body?.error}`);
  }
  const after = (await call("GET", `/api/groups/${groupId}`)).body.expenses.length;
  check("no expense was saved by the rejected requests", before === after, { before, after });

  console.log("\n7. Invalid member IDs are rejected");
  const bad = [
    ["unknown payer ID", { payerId: "not-a-real-id", participantIds: all }, "payerId"],
    ["unknown participant ID", { payerId: ids.Alice, participantIds: [ids.Alice, "not-a-real-id"] }, "participantIds"],
    ["payer from another group", { payerId: ids2[0], participantIds: all }, "payerId"],
    ["participant from another group", { payerId: ids.Alice, participantIds: [ids.Alice, ids2[1]] }, "participantIds"],
    ["duplicate participant", { payerId: ids.Alice, participantIds: [ids.Bob, ids.Bob] }, "participantIds"],
    ["no participants", { payerId: ids.Alice, participantIds: [] }, "participantIds"],
    ["missing payer", { participantIds: all }, "payerId"],
  ];
  for (const [label, fields, field] of bad) {
    const r = await call("POST", `/api/groups/${groupId}/expenses`, { description: "Bad", amount: "5", ...fields });
    check(`${label} -> 400 (field=${field})`, r.status === 400 && r.body.field === field, r);
    console.log(`        message: ${r.body?.error}`);
  }
  check(
    "no expense was saved by the rejected requests",
    (await call("GET", `/api/groups/${groupId}`)).body.expenses.length === after,
  );

  console.log("\n8. Other invalid input");
  const noName = await call("POST", "/api/groups", { name: "   " });
  check("blank group name -> 400", noName.status === 400, noName);
  console.log(`        message: ${noName.body?.error}`);
  const noDesc = await call("POST", `/api/groups/${groupId}/expenses`, { description: "", amount: "5", payerId: ids.Alice, participantIds: all });
  check("blank description -> 400", noDesc.status === 400 && noDesc.body.field === "description", noDesc);
  const badJson = await call("POST", "/api/groups", undefined, { raw: "{not json" });
  check("malformed JSON -> 400", badJson.status === 400, badJson);
  const missing = await call("GET", "/api/groups/does-not-exist");
  check("unknown group -> 404", missing.status === 404, missing);
  const missingExp = await call("POST", "/api/groups/does-not-exist/expenses", { description: "x", amount: "5", payerId: ids.Alice, participantIds: all });
  check("expense for unknown group -> 404", missingExp.status === 404, missingExp);

  console.log(`\nGroup used for the persistence check: ${groupId}`);
  return groupId;
}

const checkIdx = process.argv.indexOf("--check");
try {
  if (checkIdx !== -1) {
    await persistenceCheck(process.argv[checkIdx + 1]);
  } else {
    await fullRun();
  }
} catch (err) {
  failed++;
  console.error(`\nERROR: ${err.message}. Is the server running at ${BASE}?`);
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
