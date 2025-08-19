import { Schema, model } from 'mongoose'

const courseSchema = new Schema({
  courseCode: { type: String, required: true, unique: true },
  courseTitle: { type: String, required: true },
  courseLevel: { type: String, required: true }
}, { timestamps: true })

export default model('Course', courseSchema)
