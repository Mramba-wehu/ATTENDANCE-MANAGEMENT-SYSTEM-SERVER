import express from 'express'
import path from 'path'
import multer from 'multer'
import { newNote, getNotes, deleteNote } from '../controllers/note'

const router = express.Router()

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../assets/uploads'),
  filename: (_, file, cb) => {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}-${sanitized}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
});

router.post('/', (req, res, next) => {
  upload.single('notesFile')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ status: false, message: err.message })
    }
    next()
  })
}, newNote)

router.put('/', getNotes)

router.delete('/', deleteNote)

export default router