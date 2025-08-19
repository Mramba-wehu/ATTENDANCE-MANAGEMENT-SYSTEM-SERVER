import { Router } from 'express'
import { storeQR, validateQR } from '../controllers/qr'

const router = Router()

router.post('/', storeQR)
router.put('/', validateQR)

export default router
