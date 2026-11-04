import test from "node:test";
import assert from "node:assert/strict";
import { api } from "../src/services/api.js";
import { futureApi } from "../src/services/futureApi.js";

test("422 identifies invalid prescription field without leaking submitted values", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        JSON.stringify({
          detail: [
            {
              loc: ["body", "items", 1, "quantity"],
              msg: "Input should be greater than 0",
              input: "private-payload",
            },
          ],
        }),
        { status: 422 },
      ),
  );
  await assert.rejects(api("/prescriptions/add"), (error) => {
    assert.equal(error.status, 422);
    assert.match(error.message, /Препараты → №2 → Количество/);
    assert.ok(!error.message.includes("private-payload"));
    return true;
  });
});

test("implemented frontend endpoints preserve validation and conflict messages", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(JSON.stringify({ detail: "Пациент выписан" }), {
        status: 409,
      }),
  );
  await assert.rejects(
    futureApi("/prescriptions"),
    (error) => error.status === 409 && error.message === "Пациент выписан",
  );
});
