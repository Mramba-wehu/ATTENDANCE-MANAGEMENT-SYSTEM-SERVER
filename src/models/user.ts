import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  role: 'Admin' | 'Lecturer' | 'Student'
  regNo: string
  nationalId: string
  fullNames: string
  password: string
  courseTitle?: string
  courseCode?: string
  year?: string | null
  blocked?: boolean
}

const userSchema = new Schema<IUser>(
  {
    role: { type: String, enum: ['Admin', 'Lecturer', 'Student'], required: true },
    regNo: { type: String, required: true, unique: true },
    nationalId: { type: String, required: true },
    fullNames: { type: String, required: true },
    password: { type: String, required: true },
    courseTitle: { type: String },
    courseCode: { type: String },
    year: { type: String, default: null},
    blocked: { type: Boolean, default: false }
  },
  { timestamps: true }
)

export default mongoose.model<IUser>('User', userSchema)
