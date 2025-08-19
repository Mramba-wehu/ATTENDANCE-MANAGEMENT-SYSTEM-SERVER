import express from 'express'
import { createCourse, getCourses, updateCourse, deleteCourse } from '../controllers/course'

const router = express.Router()

router.post('/', createCourse)
router.get('/', getCourses)
router.put('/', updateCourse)
router.delete('/', deleteCourse)

export default router
