import { Request, Response } from 'express'
import mongoose from 'mongoose'
import QR from '../models/qr'
import * as security from '../utils/security'
import schedule from '../models/schedule'
import { validateData } from '../utils/validate'

export const storeQR = async (req: Request, res: Response) => {
  const session = await mongoose.startSession()
  try {
    const { qr } = security.decrypt(req.body.body)
    const { courseCode, unitCode, lecturer, date, time } = validateData('qrSchema', JSON.parse(security.decrypt(qr)))

    const raw = qr

    let message = ''
    const result = await session.withTransaction(async () => {
      await QR.findOneAndDelete({ unitCode }).session(session)

      const newQR = new QR({
        courseCode,
        unitCode,
        lecturer,
        raw,
        scheduledDate: date,
        scheduledTime: time
      })

      await newQR.save({ session })
      message = 'QR Uploaded'
      return true
    })

    if (result) {
      return res.status(201).json(security.encrypt({ message }))
    }
  } catch (error: any) {
    console.error('Store QR Error:', error)
    res.status(500).json(security.encrypt({
      message: 'Server error while storing QR data',
      error: error.message || 'Unknown error'
    }))
  } finally {
    session.endSession()
  }
}

export const validateQR = async (req: Request, res: Response) => {
  const session = await mongoose.startSession()
  try {
    const { raw, regNo } = security.decrypt(req.body.body)
    const { courseCode, unitCode, lecturer, date, time } = validateData('qrSchema', JSON.parse(security.decrypt(raw)))

    let message = ''
    const result = await session.withTransaction(async () => {
      const qrExist = await QR.findOne({ raw, unitCode, scheduledDate: date, scheduledTime: time, lecturer }).session(session)
      if (!qrExist) throw new Error('Invalid QR Code')
      console.log(date, time)
      const exist = await schedule.findOne({ unitCode, scheduledDate: date, scheduledTime: time }).session(session)
      if (!exist) throw new Error('Invalid schedule')

      let attendanceList: any[] = []

      if (exist.attended) {
        attendanceList = security.decrypt(exist.attended)

        const alreadyMarked = attendanceList.some(entry => entry.student.toLowerCase() === regNo.toLowerCase())
        if (alreadyMarked) {
          throw new Error('Attendance already marked')
        }
      }

      attendanceList.push({ raw, student: regNo })
      const attendanceData = security.encrypt(attendanceList)

      const attend = await schedule.findOneAndUpdate(
        { unitCode, scheduledDate: date, scheduledTime: time },
        { attended: attendanceData },
        { new: true, session }
      )

      if (!attend) throw new Error('Failed to complete attendance')

      message = 'Attendance Confirmed'
      return true
    })

    if (result) {
      return res.status(201).json(security.encrypt({ message }))
    }
  } catch (error: any) {
    console.error('Validate QR Error:', error)
    res.status(400).json(security.encrypt({
      message: error.message || 'Unknown error during attendance validation'
    }))
  } finally {
    session.endSession()
  }
}