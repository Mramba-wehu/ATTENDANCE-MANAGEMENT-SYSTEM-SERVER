import express from 'express'
import { addSchedule, deleteSchedule, getSchedules } from '../controllers/schedule'

const router = express.Router()

router.post('/', addSchedule)
router.put('/', getSchedules)
router.delete('/', deleteSchedule)

export default router
