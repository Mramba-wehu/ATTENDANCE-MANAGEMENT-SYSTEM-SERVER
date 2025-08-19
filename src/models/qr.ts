import { Schema, model } from 'mongoose'

const qrSchema = new Schema(
  {
    courseCode: { type: String, required: true },
    unitCode: { type: String, required: true },
    lecturer: { type: String, required: true },
    raw: { type: String, required: true, unique: true },
    scheduledDate: { type: String, required: true },
    scheduledTime: { type: String, required: true }
  },
  { timestamps: true }
)

export default model('QR', qrSchema)
