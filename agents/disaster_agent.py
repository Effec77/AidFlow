# agents/disaster_agent.py
import requests
from pymongo import MongoClient
from datetime import datetime, timezone
import time
import os

# 🌍 MongoDB Atlas connection
MONGO_URI = os.getenv("MONGO_URI", "your-atlas-uri-here")
client = MongoClient(MONGO_URI)
db = client["your_database_name"]
coll = db["disasters"]  # matches your Mongoose model

# --------- Helper Functions ---------
def in_india(lat, lon):
    return (6.0 <= lat <= 37.0) and (68.0 <= lon <= 97.0)

def normalize_usgs(event):
    coords = event["geometry"]["coordinates"]  # [lon, lat, depth]
    props = event["properties"]
    return {
        "type": "earthquake",
        "place": props.get("place"),
        "magnitude": props.get("mag"),
        "coords": [coords[0], coords[1]],
        "time": datetime.fromtimestamp(props["time"] / 1000, tz=timezone.utc),
    }

def normalize_firms(event):
    coords = event["geometry"]["coordinates"]  # [lon, lat]
    props = event["properties"]
    brightness = props.get("brightness")
    acq_date = props.get("acq_date")
    acq_time = props.get("acq_time")
    try:
        event_time = datetime.strptime(f"{acq_date} {acq_time}", "%Y-%m-%d %H%M").replace(tzinfo=timezone.utc)
    except Exception:
        event_time = datetime.now(timezone.utc)
    return {
        "type": "fire",
        "place": props.get("satellite") or "Unknown area",
        "magnitude": (float(brightness) / 100) if brightness else None,
        "coords": [coords[0], coords[1]],
        "time": event_time,
    }

def upsert_events(events):
    inserted = 0
    for ev in events:
        try:
            coll.update_one(
                {"coords": ev["coords"], "time": ev["time"]},
                {"$setOnInsert": ev},
                upsert=True,
            )
            inserted += 1
        except Exception as e:
            print("Upsert failed:", e)
    return inserted

# --------- Main Pipeline ---------
def run_pipeline():
    USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
    FIRMS_URL = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/c6/geojson/global/24h.json"

    print("Fetching earthquake data...")
    eq_data = requests.get(USGS_URL).json()["features"]
    print("Fetching fire data...")
    fire_data = requests.get(FIRMS_URL).json()["features"]

    earthquakes = [normalize_usgs(f) for f in eq_data if in_india(f["geometry"]["coordinates"][1], f["geometry"]["coordinates"][0])]
    fires = [normalize_firms(f) for f in fire_data if in_india(f["geometry"]["coordinates"][1], f["geometry"]["coordinates"][0])]

    all_events = earthquakes + fires
    inserted = upsert_events(all_events)

    print(f"✅ Inserted/updated {inserted} disaster records in MongoDB.")
    return inserted

if __name__ == "__main__":
    while True:
        run_pipeline()
        print("Sleeping for 1 hour...")
        time.sleep(3600)  # rerun hourly
