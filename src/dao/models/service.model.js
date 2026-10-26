import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  duration: { type: Number, required: true }, // en minutos
  price: { type: Number, required: true },
  category: { type: String },
  available: { type: Boolean, default: true },
});

export const ServiceModel = mongoose.model("Service", serviceSchema);
