import { Schema, model } from 'mongoose'

const scheduleSchema = new Schema({
  courseCode: { type: String, required: true },
  unitCode: { type: String, required: true },
  scheduledDate: { type: String, required: true },
  scheduledTime: { type: String, required: true },
  attended: { type: String, default: null}
}, { timestamps: true })

export default model('Schedule', scheduleSchema)
