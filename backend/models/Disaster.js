import mongoose from "mongoose";

const disasterSchema = new mongoose.Schema({
  type: { type: String, required: true }, // "earthquake" or "fire"
  place: { type: String },
  magnitude: { type: Number },
  coords: { type: [Number], required: true }, // [lon, lat]
  time: { type: Date, required: true },
});

const Disaster = mongoose.model("Disaster", disasterSchema);
export default Disaster;
