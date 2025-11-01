import fetch from "node-fetch";

async function testEarthquakeAPI() {
  const url = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=6.5&maxlatitude=37.0&minlongitude=68.0&maxlongitude=97.5&limit=50";
  const res = await fetch(url);
  const data = await res.json();
  console.log("Earthquakes fetched:", data.features.length);
  console.log(data.features[0]); // see first earthquake
}

testEarthquakeAPI();
