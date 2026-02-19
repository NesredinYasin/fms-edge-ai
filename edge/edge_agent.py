import json
import os
import time
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv
import paho.mqtt.client as mqtt

load_dotenv()

MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "telemetry/raw")

CLOUD_BASE_URL = os.getenv("CLOUD_BASE_URL", "http://localhost:8080")
CLOUD_TOKEN = os.getenv("CLOUD_TOKEN", "")
BUFFER_FILE = os.getenv("EDGE_BUFFER_FILE", "edge_buffer.jsonl")

HEADERS = {"Authorization": f"Bearer {CLOUD_TOKEN}", "Content-Type": "application/json"}

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def safe_float(x):
    try:
        return float(x)
    except Exception:
        return None

def extract_features(msg: dict):
    # Minimal feature extraction (extend for thesis)
    speed = safe_float(msg.get("speed_kmh"))
    fuel = safe_float(msg.get("fuel_rate"))
    temp = safe_float(msg.get("engine_temp"))

    features = {
        "speed_kmh": speed,
        "fuel_rate": fuel,
        "engine_temp": temp,
        "is_speeding": (speed is not None and speed > 100),
        "is_overheat": (temp is not None and temp > 105),
        "fuel_spike": (fuel is not None and fuel > 25)
    }
    return features

def lightweight_inference(vehicle_code: str, ts: str, features: dict):
    # Replace with real models (DecisionTree / IsolationForest / TFLite)
    alerts = []

    if features.get("is_speeding"):
        alerts.append({
            "vehicle_code": vehicle_code,
            "ts": ts,
            "type": "DRIVER_BEHAVIOR_SPEEDING",
            "severity": 3,
            "message": "Overspeeding detected at the edge",
            "details": {"speed_kmh": features.get("speed_kmh")}
        })

    if features.get("fuel_spike"):
        alerts.append({
            "vehicle_code": vehicle_code,
            "ts": ts,
            "type": "FUEL_ANOMALY",
            "severity": 4,
            "message": "Abnormal fuel usage detected at the edge",
            "details": {"fuel_rate": features.get("fuel_rate")}
        })

    if features.get("is_overheat"):
        alerts.append({
            "vehicle_code": vehicle_code,
            "ts": ts,
            "type": "MAINTENANCE_RISK_OVERHEAT",
            "severity": 4,
            "message": "Engine overheating risk detected at the edge",
            "details": {"engine_temp": features.get("engine_temp")}
        })

    return alerts

def buffer_line(obj: dict):
    with open(BUFFER_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(obj) + "\n")

def flush_buffer():
    if not os.path.exists(BUFFER_FILE):
        return

    remaining = []
    with open(BUFFER_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            remaining.append(line)

    if not remaining:
        return

    new_remaining = []
    for line in remaining:
        obj = json.loads(line)
        ok = send_to_cloud(obj)
        if not ok:
            new_remaining.append(line)

    with open(BUFFER_FILE, "w", encoding="utf-8") as f:
        for line in new_remaining:
            f.write(line + "\n")

def send_to_cloud(obj: dict) -> bool:
    kind = obj.get("_kind")
    try:
        if kind == "telemetry":
            r = requests.post(f"{CLOUD_BASE_URL}/api/telemetry/ingest", headers=HEADERS, data=json.dumps(obj["payload"]), timeout=5)
            return r.status_code < 300
        if kind == "alert":
            r = requests.post(f"{CLOUD_BASE_URL}/api/alerts/ingest", headers=HEADERS, data=json.dumps(obj["payload"]), timeout=5)
            return r.status_code < 300
    except Exception:
        return False
    return True

def on_message(_client, _userdata, msg):
    try:
        raw = json.loads(msg.payload.decode("utf-8"))
    except Exception:
        return

    vehicle_code = raw.get("vehicle_code") or raw.get("vehicleId") or raw.get("vehicle_id")
    if not vehicle_code:
        return

    ts = raw.get("ts") or raw.get("timestamp") or now_iso()
    telemetry_payload = {
        "vehicle_code": vehicle_code,
        "ts": ts,
        "lat": safe_float(raw.get("lat")),
        "lon": safe_float(raw.get("lon")),
        "speed_kmh": safe_float(raw.get("speed_kmh")),
        "fuel_rate": safe_float(raw.get("fuel_rate")),
        "engine_temp": safe_float(raw.get("engine_temp")),
        "raw": raw
    }

    features = extract_features(telemetry_payload)
    alerts = lightweight_inference(vehicle_code, ts, features)

    # Send telemetry (or buffer if offline)
    t_obj = {"_kind": "telemetry", "payload": telemetry_payload}
    if not send_to_cloud(t_obj):
        buffer_line(t_obj)

    # Send alerts (or buffer)
    for a in alerts:
        a_obj = {"_kind": "alert", "payload": a}
        if not send_to_cloud(a_obj):
            buffer_line(a_obj)

    # Try flushing old buffered data
    flush_buffer()

def main():
    if not CLOUD_TOKEN:
        print("ERROR: CLOUD_TOKEN missing. Login to backend and paste token into edge/.env")
        return

    client = mqtt.Client()
    client.on_message = on_message
    client.connect(MQTT_HOST, MQTT_PORT, 60)
    client.subscribe(MQTT_TOPIC)
    print(f"Edge agent subscribed to {MQTT_TOPIC} on {MQTT_HOST}:{MQTT_PORT}")
    client.loop_forever()

if __name__ == "__main__":
    main()
