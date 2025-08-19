import { Schema, model } from 'mongoose'

const pleaSchema = new Schema({
  regNo: { type: String, required: true },
  courseCode: { type: String, required: true },
  unitCode: { type: String, required: true },
  scheduledDate: { type: String, required: true },
  scheduledTime: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true }
}, { timestamps: true })

export default model('Plea', pleaSchema)
