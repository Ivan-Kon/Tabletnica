import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

test("API mode logs in, sends patient fields and reloads server records", async (t) => {
  const server = await createServer({ mode: "api", server: { middlewareMode: true }, appType: "custom" });
  t.after(() => server.close());
  const { authService } = await server.ssrLoadModule("/src/services/authService.js");
  const { patientsService } = await server.ssrLoadModule("/src/services/patientsService.js");
  const saved = [];
  let loggedIn = false;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(options.credentials, "include");
    const path = new URL(url).pathname;
    if (path === "/users/login") { loggedIn = true; return Response.json({ id: 7, full_name: "Nurse", role: "nurse" }); }
    if (path === "/users/logout") { loggedIn = false; return new Response(null, { status: 204 }); }
    if (!loggedIn) return Response.json({ detail: "Authentication required" }, { status: 401 });
    if (path === "/users/me") return Response.json({ id: 7, full_name: "Nurse", role: "nurse" });
    if (path === "/patients/add") {
      const fields = JSON.parse(options.body);
      assert.deepEqual(fields, { full_name: "Test Patient", room_number: "204А", bed_number: "01", status: "active" });
      saved.push({ ...fields, id: 123, created_at: "2026-11-04T12:00:00", updated_at: "2026-11-04T12:00:00" });
      return Response.json(saved[0], { status: 201 });
    }
    if (path === "/patients/get_all") return Response.json(saved);
    if (path === "/patients/get/123") return Response.json(saved[0]);
    throw new Error(`Unexpected request: ${path}`);
  });
  assert.equal(await authService.restore(), null);
  assert.equal((await authService.login("nurse", "test")).id, 7);
  const record = await patientsService.register({ full_name: " Test Patient ", room_number: " 204А ", bed_number: "01", status: "active", id: 999, created_at: "ignored" });
  assert.equal(record.id, 123);
  assert.equal((await authService.restore()).id, 7);
  assert.deepEqual(await patientsService.getPatient(123), record);
  assert.deepEqual(await patientsService.getPatients(), [record]);
  await authService.logout();
  await assert.rejects(patientsService.register({ full_name: "Test Patient", room_number: "204А", bed_number: "01", status: "active" }), (error) => error.status === 401);
  assert.equal(saved.length, 1);
});
