import { Request, Response } from 'express'
import mongoose from 'mongoose'
import Schedule from '../models/schedule'
import * as security from '../utils/security'
import { validateData } from '../utils/validate'
import unit from '../models/unit'
import qr from '../models/qr'

export const getSchedules = async (req: Request, res: Response) => {
  const session = await mongoose.startSession()
  try {
    let message = '';
    const decrypted = security.decrypt(req.body.body);
    const { courseCode } = decrypted;
    if (!courseCode) {
      return res.status(400).json(security.encrypt({ message: 'Invalid course code' }));
    }

    const result = await session.withTransaction(async () => {

      const schedules = await Schedule.find({ courseCode }).session(session);
      if (!schedules || schedules.length < 1) {
        message = `Schedules not found`;
        return false;
      }

      return res.status(200).json(security.encrypt({ schedules }));
    });

    if (!result) {
      return res.status(404).json(security.encrypt({ message }));
    }
  }  catch (error: any) {
    console.error('Fetch Schedule Error:', error)
    res.status(500).json(security.encrypt({
      message: 'Server error while getting schedules',
      error: error.message || 'Unknown error',
    }))
  } finally {
    session.endSession();
  }
}

export const addSchedule = async (req: Request, res: Response) => {
  const session = await mongoose.startSession()
  try {
    const data = security.decrypt(req.body.body)
    const { courseCode, unitCode, scheduledDate, scheduledTime } = validateData('tempoSchema', data)
    let message = ''
    
    const result = await session.withTransaction(async() => {
      const existingUnit = await unit.findOne({ unitCode })
      if(!existingUnit) {
        message = 'Unit not found'
        return false
      }

      const existingSchedule = await Schedule.findOne({ unitCode, scheduledDate, scheduledTime })

      if(existingSchedule) {
        message = 'Schedule already found for this unit at exact date and time. Remove current schedule to add a new one.'
        return false
      }

      const schedule = new Schedule({ courseCode: courseCode.toLowerCase(), unitCode: unitCode.toLowerCase(), scheduledDate, scheduledTime})
      
      await schedule.save({ session })

      message = 'Schedule added successfully'
      await session.commitTransaction()
      return true
    })

    if (!result) {
      return res.status(400).json(security.encrypt({ message }));
    }

    return res.status(201).json(security.encrypt({ message }));
  } catch (error: any) {
    console.error('Add Schedule Error:', error)
    res.status(500).json(security.encrypt({
      message: 'Server error while adding schedule',
      error: error.message || 'Unknown error',
    }))
  } finally {
    session.endSession();
  }
}

export const deleteSchedule = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    let message = '';
    const decrypted = security.decrypt(req.body.body);
    const { unitCode } = validateData('deleteTempoSchema', decrypted);

    const result = await session.withTransaction(async () => {

      const scheduleDelete = await Schedule.findOneAndDelete({ unitCode }).session(session);

      if (!scheduleDelete) {
        message = `Schedule not found`;
        return false;
      }

      await qr.deleteMany({ unitCode }).session(session)

      message = `Schedule removed successfully`;
      return true;
    });

    if (!result) {
      return res.status(404).json(security.encrypt({ message }));
    }

    return res.status(200).json(security.encrypt({ message }));
  } catch (error: any) {
    console.error('Delete Schedule Error:', error);
    return res.status(500).json(security.encrypt({
      message: 'Server error while removing schedule',
      error: error.message || 'Unknown error',
    }));
  } finally {
    session.endSession();
  }
};