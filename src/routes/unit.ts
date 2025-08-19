import express from 'express'
import { createUnit, getUnits, deleteUnit } from '../controllers/unit'

const router = express.Router()

router.post('/new', createUnit)
router.post('/', getUnits)
router.delete('/', deleteUnit)

export default router
