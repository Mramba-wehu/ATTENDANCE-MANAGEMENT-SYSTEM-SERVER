import { Schema, model } from 'mongoose'

const unitSchema = new Schema({
  unitCode: { type: String, required: true },
  unitTitle: { type: String, required: true },
  unitYear: { type: Number, required: true },
  courseCode: { type: String, required: true }
}, { timestamps: true })

export default model('Unit', unitSchema)
