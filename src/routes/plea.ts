import express from 'express'
import multer from 'multer'
import path from 'path'
import { getPleas, newPlea, deletePlea, updatePleaStatus } from '../controllers/plea'

const router = express.Router()
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../assets/uploads'),
  filename: (_, file, cb) => {
    const timestamp = Date.now()
    const sanitized = file.originalname.replace(/\s+/g, '_')
    cb(null, `${timestamp}-${sanitized}`)
  },
})

const upload = multer({
  storage,
  fileFilter: (_, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg']
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only image files (PNG, JPG, JPEG) are allowed'))
    }
    cb(null, true)
  },
})

router.post('/', (req, res, next) => {
  upload.single('pleaFile')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ status: false, message: err.message })
    }
    next()
  })
}, newPlea)

router.put('/', getPleas)

router.delete('/', deletePlea)

router.patch('/status', updatePleaStatus)

export default router