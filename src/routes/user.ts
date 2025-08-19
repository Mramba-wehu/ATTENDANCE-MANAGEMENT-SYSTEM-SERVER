import express from 'express'
import { getUsers, updateUser, blockUser, deleteUser } from '../controllers/user'

const router = express.Router()

router.get('/', getUsers)
router.put('/update', updateUser)
router.put('/block', blockUser)
router.delete('/', deleteUser)

export default router
