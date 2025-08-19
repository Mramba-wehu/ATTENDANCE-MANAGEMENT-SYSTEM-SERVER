import { Request, Response } from 'express'
import mongoose from 'mongoose';
import Course from '../models/course';
import Unit from '../models/unit'
import { validateData } from '../utils/validate';
import * as security from '../utils/security'

export const getUnits = async (req: Request, res: Response) => {
  try {
    const { courseCode } = security.decrypt(req.body.body)

    if (!courseCode) {
      res.status(400).json(security.encrypt({ message: 'Course Code required' }))
    }
    
    const units = await Unit.find({ courseCode })

    res.json(security.encrypt(units))
  } catch (error: any) {
    console.error('Get Units Error:', error)
    res.status(500).json(security.encrypt({
      message: 'Server error while fetching units',
      error: error.message || 'Unknown error',
    }))
  }
}

export const createUnit = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    const data = security.decrypt(req.body.body)
    const { unitCode, unitTitle, unitYear, courseCode } = validateData('unitSchema', data);

    let message = '';

    const result = await session.withTransaction(async() => {
      const existingCourse = await Course.findOne({ courseCode }).session(session);
      if (!existingCourse) {
        message = 'Course does not exist';
        return false;
      }
      
      const newUnit = new Unit({ unitCode: unitCode.toLowerCase(), unitTitle: unitTitle.toLowerCase(), unitYear: unitYear.toString().toLowerCase(), courseCode: courseCode.toLowerCase() })

      await newUnit.save({ session })

      message = `Unit ${unitTitle} registered successfully `
      return true
    })
    
    if (!result) {
      return res.status(400).json(security.encrypt({ message }));
    }

    return res.status(201).json(security.encrypt({ message }));
  } catch (error: any) {
    console.error('Create Unit Error:', error)
    res.status(500).json(security.encrypt({
    message: 'Server error while creating unit',
    error: error.message || 'Unknown error',
    }))
  } finally {
    session.endSession();
  }
}

export const deleteUnit = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    let message = '';
    const decrypted = security.decrypt(req.body.body)
    const { unitCode } = validateData('deleteUnitSchema', decrypted)

    if (!unitCode) {
      res.status(404).json(security.encrypt({message: 'Invalid unit code'}))
    }

    const result = await session.withTransaction(async() => {
      const code = unitCode.toString().toLowerCase()
      const deleted = await Unit.findOneAndDelete({ unitCode: code }).session(session)

      if (!deleted) {
        message= `Unit not found`
        return false
      }

      message = `Unit deleted successfully `
      await session.commitTransaction()
      return true
    })

    if (!result) {
      return res.status(400).json(security.encrypt({ message }));
    }

    return res.status(201).json(security.encrypt({ message }));
  } catch (error: any) {
    console.error('Delete Unit Error:', error)
    res.status(500).json(security.encrypt({
      message: 'Server error while deleting unit',
      error: error.message || 'Unknown error',
    }))
  } finally {
    session.endSession()
  }
}

