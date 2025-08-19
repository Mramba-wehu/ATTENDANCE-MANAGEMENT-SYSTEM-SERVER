import { Schema, model } from 'mongoose'

const noteSchema = new Schema({
  courseCode: { type: String, required: true },
  unitCode: { type: String, required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true }
}, { timestamps: true })

export default model('Note', noteSchema)
