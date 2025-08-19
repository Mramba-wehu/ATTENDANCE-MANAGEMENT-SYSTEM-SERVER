import User from '../models/user'
import bcrypt from 'bcryptjs'

const validateEnv = () => {
  const required = ['MONGO_URI', 'ATLAS_URI', 'PORT', 'SECRET_KEY']
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }
}

const ensureAdminExists = async () => {
  const adminExists = await User.findOne({ role: 'Admin' })

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin', 10)

    await User.create({
      role: 'Admin',
      regNo: 'admin',
      fullNames: 'System Admin',
      nationalId: '00000000',
      password: hashedPassword,
    })

    console.log('✅ Default admin user created')
  }
}

export const initApp = async () => {
  validateEnv()
  await ensureAdminExists()
}