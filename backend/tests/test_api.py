import os
# Tests always override external configuration before importing the application.
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["COOKIE_SECURE"] = "false"
import unittest
from datetime import UTC, datetime, timedelta, time
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from sqlalchemy.schema import CreateTable
from sqlalchemy.dialects import mysql
from backend.src.main import app
from backend.src.database import Base, engine, init_db, async_session
from backend.src.users.crud import register_user
from backend.src.users.schemas import UserSchema
from backend.src.users.models import User
from backend.src.auth import UserSession, token_hash
from backend.src.pillboxes.models import Pillbox
from backend.src.patients.models import Patient
from backend.src.cells.models import Cells
from backend.src.prescriptions.models import Prescription
from backend.src.prescriptions_items.models import PrescriptionItem
from backend.src.cells_configs.models import CellConfig
from backend.src.schedules_times.models import ScheduleTime
from backend.src.alerts.models import Alert

class ApiTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        # Destruction is confined to this explicitly in-memory test engine.
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await init_db()
        self.client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
        async with async_session() as session:
            await register_user(session, UserSchema(username="admin", password="test-password", full_name="Admin", role="admin", active=True))

    async def asyncTearDown(self):
        await self.client.aclose()
        await engine.dispose()

    async def login(self):
        response = await self.client.post("/users/login", json={"username":"admin", "password":"test-password"})
        self.assertEqual(response.status_code, 200, response.text)
        return response

    async def test_login_me_logout_and_secrets(self):
        self.assertEqual((await self.client.get("/patients/get_all")).status_code, 401)
        bad = await self.client.post("/users/login", json={"username":"admin", "password":"wrong"})
        self.assertEqual(bad.status_code, 401)
        response = await self.login()
        self.assertNotIn("password", response.text)
        self.assertIn("HttpOnly", response.headers["set-cookie"])
        token = self.client.cookies.get("session_id")
        async with async_session() as session:
            record = await session.get(UserSession, token_hash(token))
            self.assertIsNotNone(record)
            self.assertNotEqual(record.token_hash, token)
        self.assertEqual((await self.client.get("/users/me")).status_code, 200)
        self.assertEqual((await self.client.post("/users/logout")).status_code, 204)
        self.client.cookies.set("session_id", token)
        self.assertEqual((await self.client.get("/users/me")).status_code, 401)

    async def test_inactive_expired_and_cross_origin_sessions(self):
        await self.login()
        self.assertEqual((await self.client.post("/users/logout", headers={"Origin":"https://other.example"})).status_code, 403)
        async with async_session() as session:
            record = await session.scalar(select(UserSession))
            record.expires_at = datetime.now(UTC).replace(tzinfo=None) - timedelta(seconds=1)
            await session.commit()
        self.assertEqual((await self.client.get("/users/me")).status_code, 401)
        async with async_session() as session:
            user = await session.get(User, 1)
            user.active = False
            await session.commit()
        self.assertEqual((await self.client.post("/users/login", json={"username":"admin","password":"test-password"})).status_code, 401)

    async def test_registration_requires_admin_and_hides_password(self):
        payload = {"username":"nurse", "password":"test-password", "full_name":"Nurse", "role":"elder_nurse", "active":True}
        self.assertEqual((await self.client.post("/users/register", json=payload)).status_code, 401)
        await self.login()
        response = await self.client.post("/users/register", json=payload)
        self.assertEqual(response.status_code, 201, response.text)
        self.assertNotIn("password", response.text)
        self.assertEqual((await self.client.post("/users/register", json=payload)).status_code, 409)
        await self.client.post("/users/login", json={"username":"nurse", "password":"test-password"})
        self.assertEqual((await self.client.post("/users/register", json=payload)).status_code, 403)
        self.assertEqual((await self.client.post("/users/check_user", json=payload)).status_code, 404)

    async def test_patient_crud_and_missing_record(self):
        await self.login()
        data = {"full_name":"Test Patient", "room_number":"200", "bed_number":"1", "status":"active"}
        invalid = await self.client.post("/patients/add", json={**data, "full_name": "  "})
        self.assertEqual(invalid.status_code, 422)
        response = await self.client.post("/patients/add", json=data)
        self.assertEqual(response.status_code, 201, response.text)
        patient_id = response.json()["id"]
        self.assertEqual((await self.client.get(f"/patients/get/{patient_id}")).json()["full_name"], data["full_name"])
        response = await self.client.patch(f"/patients/update_status/{patient_id}", json={"status":"discharged"})
        self.assertEqual(response.status_code, 202, response.text)
        self.assertEqual(response.json()["status"], "discharged")
        self.assertEqual((await self.client.delete(f"/patients/delete/{patient_id}")).status_code, 204)
        self.assertEqual((await self.client.get(f"/patients/get/{patient_id}")).status_code, 404)

    async def test_init_is_not_exposed_or_destructive(self):
        await self.login()
        self.assertEqual((await self.client.post("/init_db")).status_code, 404)
        await init_db()
        async with async_session() as session:
            self.assertIsNotNone(await session.get(User, 1))
        with self.assertRaises(ValueError):
            await init_db(drop_first=True)
        for table in Base.metadata.sorted_tables:
            str(CreateTable(table).compile(dialect=mysql.dialect()))

    async def seed_configuration(self):
        now = datetime.now(UTC).replace(tzinfo=None)
        async with async_session() as session:
            session.add(Patient(id=1, full_name="Test", room_number="1", bed_number="1", status="active", created_at=now, updated_at=now))
            session.add(Pillbox(id=1, serial_number="SN-1", device_token_hash="private-hash", status="available", last_seen_at=None, created_at=now, updated_at=now))
            await session.flush()
            session.add(Cells(id=1, pillbox_id=1, cell_number=1, status="free", created_at=now))
            session.add(Prescription(id=1, patient_id=1, entered_by=1, source_type="manual", source_document_number=1, prescribed_by="Doctor Name", status="new", created_at=now, updated_at=now))
            await session.flush()
            session.add(PrescriptionItem(id=1, prescription_id=1, drug_name="Test", dosage="10 mg", quantity=1, dosage_form="tablet", start_date=now.date(), end_date=None, status="new", external_drug_id="", drug_source="manual", created_at=now, updated_at=now))
            await session.flush()
            session.add(CellConfig(id=1, cell_id=1, assignment_id=None, prescription_item_id=1, baseline_weight=1, status="configured", configured_at=now, loaded_at=now))
            await session.commit()

    async def test_schedule_round_trip_status_and_time(self):
        await self.login()
        await self.seed_configuration()
        data = {"schedule_type":"interval", "interval_minutes":360, "anchor_at":"2026-10-18T08:00:00", "start_date":"2026-10-18", "cell_config_id":1, "status":"active"}
        response = await self.client.post("/schedules/add", json=data)
        self.assertEqual(response.status_code, 201, response.text)
        schedule_id = response.json()["id"]
        self.assertEqual(response.json()["cell_config_id"], 1)
        response = await self.client.patch("/schedules/update_status", params={"schedule_int":schedule_id, "status_schedule":"paused"})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual((await self.client.get(f"/schedules/get/{schedule_id}")).json()["status"], "paused")
        self.assertEqual((await self.client.patch("/schedules/update_status", params={"schedule_int":schedule_id,"status_schedule":"invalid"})).status_code, 422)
        async with async_session() as session:
            session.add(ScheduleTime(id=1, schedule_id=schedule_id, time_of_day=time(8,30)))
            await session.commit()
        self.assertEqual((await self.client.get("/schedules_times/get_schedule_time/1")).json()["time_of_day"], "08:30:00")
        self.assertEqual((await self.client.get("/schedules_times/get_schedule_time/999")).status_code, 404)
        self.assertEqual((await self.client.post("/schedules/add", json={**data,"end_date":"2020-01-01"})).status_code, 422)
        self.assertEqual((await self.client.post("/schedules/add", json={**data,"cell_config_id":999})).status_code, 409)

    async def test_pillbox_alerts_and_prescriptions_response_contracts(self):
        await self.login()
        await self.seed_configuration()
        response = await self.client.get("/pillboxes/get/1")
        self.assertEqual(response.status_code, 200, response.text)
        self.assertNotIn("device_token_hash", response.text)
        self.assertEqual((await self.client.get("/pillboxes/get/999")).status_code, 404)
        async with async_session() as session:
            session.add(Alert(id=1, patient_id=None, pillbox_id=None, event_id=None, alert_type="device_error", priority="high", status="resolved", config_version=1, acknowledged_by=None, created_at=datetime.now(UTC).replace(tzinfo=None), acknowledged_at=None))
            await session.commit()
        response = await self.client.get("/alerts/get_all")
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()[0]["status"], "resolved")
        response = await self.client.get("/prescriptions/get_all")
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()[0]["prescribed_by"], "Doctor Name")
        response = await self.client.post("/prescriptions/add", json={
            "patient_id": 1, "entered_by": 999, "source_type": "manual",
            "source_document_number": 2, "prescribed_by": "Doctor Name", "status": "new"})
        self.assertEqual(response.status_code, 201, response.text)
        self.assertEqual(response.json()["entered_by"], 1)


    async def test_cors_and_legacy_entrypoint(self):
        from src.main import app as legacy_app
        self.assertIs(legacy_app, app)
        response = await self.client.options("/patients/get_all", headers={"Origin":"http://127.0.0.1:5173","Access-Control-Request-Method":"GET"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["access-control-allow-origin"], "http://127.0.0.1:5173")
        self.assertEqual((await self.client.get("/health")).json(), {"status":"ok"})

    async def test_nurse_document_payload_round_trips_both_endpoints(self):
        await self.login()
        response = await self.client.post("/patients/add", json={
            "full_name":"Patient", "room_number":"12", "bed_number":"1", "status":"active"})
        patient_id = response.json()["id"]
        payload = {"patient_id":patient_id, "doctor_name":"Doctor Name", "items":[
            {"drug_name":"Drug A", "dosage":"100 mg", "quantity":0.5,
             "start_date":"2026-10-26", "end_date":"", "comment":"With food",
             "schedule":{"schedule_type":"SPECIFIC_TIME", "specific_times":["08:00","20:00"],
                         "interval_minutes":360,"anchor_at":"2026-10-26T21:30:00+03:00"}},
            {"drug_name":"Drug B", "dosage":"10 mg", "quantity":1,
             "start_date":"2026-10-26", "end_date":"2026-11-01", "comment":"Night dose",
             "schedule":{"schedule_type":"INTERVAL", "specific_times":["08:00"],
                         "interval_minutes":360,"anchor_at":"2026-10-26T21:30:00+03:00"}}]}
        for endpoint in ("/prescriptions/add", "/frontend/v1/prescriptions"):
            body = dict(payload)
            if endpoint == "/frontend/v1/prescriptions":
                body["prescribed_by"] = body.pop("doctor_name")
            response = await self.client.post(endpoint, json=body)
            self.assertEqual(response.status_code, 201, response.text)
            self.assertEqual(response.json()["prescribed_by"], "Doctor Name")
            document_id = response.json()["id"]
            # A separate GET/session proves persistence, not just an echoed POST response.
            response = await self.client.get("/frontend/v1/prescription-items")
            self.assertEqual(response.status_code, 200, response.text)
            items = [item for item in response.json() if item["prescription_id"] == document_id]
            self.assertEqual(len(items), 2)
            self.assertEqual(items[0]["comment"], "With food")
            self.assertEqual(items[0]["quantity"], 0.5)
            self.assertIsNone(items[0]["end_date"])
            self.assertEqual(items[0]["schedule"]["specific_times"], ["08:00", "20:00"])
            self.assertEqual(items[1]["schedule"]["anchor_at"], "2026-10-26T21:30:00+03:00")
            self.assertEqual(items[0]["prescription"]["doctor_name"], "Doctor Name")
        self.assertEqual((await self.client.get("/prescriptions/get_all")).status_code, 200)

    async def test_document_rejects_invalid_items_and_rolls_back_database_failure(self):
        from sqlalchemy import event, func
        from backend.src.prescriptions.document import PrescriptionItemPlan
        await self.login()
        await self.client.post("/patients/add", json={"full_name":"Patient", "room_number":"1", "bed_number":"1", "status":"active"})
        item = {"drug_name":"Drug", "dosage":"100 mg", "quantity":1, "start_date":"2026-10-26",
                "schedule":{"schedule_type":"SPECIFIC_TIME", "specific_times":["08:00"]}}
        payload = {"patient_id":1, "doctor_name":"Doctor", "items":[item]}
        mismatch = await self.client.post("/frontend/v1/prescriptions", json={**payload, "prescribed_by":"Another doctor"})
        self.assertEqual(mismatch.status_code, 422)
        bad = await self.client.post("/frontend/v1/prescriptions", json={**payload, "items":[item, {**item,"quantity":0}]})
        self.assertEqual(bad.status_code, 422, bad.text)
        self.assertEqual((await self.client.get("/frontend/v1/prescription-items")).json(), [])
        def fail_plan(*_args):
            raise RuntimeError("Simulated storage failure")
        event.listen(PrescriptionItemPlan, "before_insert", fail_plan)
        try:
            with self.assertRaises(RuntimeError):
                await self.client.post("/frontend/v1/prescriptions", json=payload)
        finally:
            event.remove(PrescriptionItemPlan, "before_insert", fail_plan)
        async with async_session() as session:
            self.assertEqual(await session.scalar(select(func.count()).select_from(Prescription)), 0)
            self.assertEqual(await session.scalar(select(func.count()).select_from(PrescriptionItem)), 0)
        await self.client.patch("/patients/update_status/1", json={"status":"discharged"})
        self.assertEqual((await self.client.post("/frontend/v1/prescriptions", json=payload)).status_code, 409)
        self.assertEqual((await self.client.post("/frontend/v1/prescriptions", json={**payload,"patient_id":999})).status_code, 404)

if __name__ == "__main__":
    unittest.main()
