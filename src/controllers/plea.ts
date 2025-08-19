import { Request, Response } from 'express'
import mongoose from 'mongoose'
import path from 'path'
import fs from 'fs'
import mime from 'mime-types'
import * as security from '../utils/security'
import plea from '../models/plea'
import { validateData } from '../utils/validate'

export const getPleas = async (req: Request, res: Response) => {
  const session = await mongoose.startSession()
  try {
    let message = ''
    const decrypted = security.decrypt(req.body.body)
    const { courseCode } = decrypted

    if (!courseCode) {
      return res.status(400).json(security.encrypt({ message: 'Invalid course code' }))
    }

    const result = await session.withTransaction(async () => {
      const pleas = await plea.find({ courseCode }).session(session)
      if (!pleas || pleas.length < 1) {
        message = `Pleas not found`
        return false
      }

      await session.commitTransaction()
      return res.status(200).json(security.encrypt({ pleas }))
    })

    if (!result) {
      return res.status(404).json(security.encrypt({ message }))
    }
  } catch (error: any) {
    console.error('Fetch Pleas Error:', error)
    res.status(500).json(security.encrypt({
      message: 'Server error while getting pleas',
      error: error.message || 'Unknown error',
    }))
  } finally {
    session.endSession()
  }
}

export const newPlea = async (req: Request, res: Response) => {
  const session = await mongoose.startSession()

  try {
    if (!req.file) {
      return res.status(400).json(security.encrypt({ message: 'No file uploaded' }))
    }

    const decrypted = security.decrypt(JSON.parse(req.body.body))
    const { regNo, courseCode, unitCode, reason, scheduledDate, scheduledTime } = validateData('pleaSchema', decrypted)

    const mimeType = req.file.mimetype

    const allowedTypes = ['png', 'jpg', 'jpeg']
    const fileType = mime.extension(mimeType.toString());

    if (!fileType || !allowedTypes.includes(fileType)) {
      return res.status(400).json(security.encrypt({ message: 'Only image files are allowed' }));
    }

    const folder = 'plea'
    const destFolder = path.join(__dirname, '../assets/', folder)

    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true })
    }

    const uploadedFile = req.file
    const finalName = `${Date.now()}-${uploadedFile.originalname.replace(/\s+/g, '_')}`
    const destPath = path.join(destFolder, finalName)
    const webUrl = `/${folder.toLowerCase()}-src/${finalName}`

    await session.withTransaction(async () => {
      const existing = await plea.findOne({ courseCode, unitCode, scheduledDate, scheduledTime }).session(session)
      if (existing) {
        throw new Error('Plea for this unit already exists')
      }

      const newPleaDoc = new plea({
        regNo,
        courseCode,
        unitCode,
        reason,
        scheduledDate,
        scheduledTime,
        fileName: finalName,
        fileUrl: webUrl,
      })

      await newPleaDoc.save({ session })

      try {
        fs.copyFileSync(uploadedFile.path, destPath)
        fs.unlinkSync(uploadedFile.path)
      } catch (copyError) {
        console.error('File copy failed:', copyError)
        throw new Error('File copy failed. Transaction rolled back.')
      }
    })

    res.status(201).json(security.encrypt({ message: 'Plea uploaded successfully' }))
  } catch (error: any) {
    console.error('New Plea Error:', error)
    const message = error instanceof Error ? error.message : 'Server error during plea upload'
    res.status(500).json(security.encrypt({ message }))
  } finally {
    session.endSession()
  }
}

export const deletePlea = async (req: Request, res: Response) => {
  const session = await mongoose.startSession()

  try {
    const decrypted = security.decrypt(req.body.body)
    const { _id } = validateData('deletePleaSchema', decrypted)

    let message = ''

    const result = await session.withTransaction(async () => {
      const foundPlea = await plea.findOne({ _id }).session(session)
      if (!foundPlea) {
        message = 'Plea not found'
        return false
      }

      const deletion = await plea.findOneAndDelete({ _id }).session(session)
      if (!deletion) {
        message = 'Failed to delete plea from database'
        return false
      }

      const relativeFilePath = `/plea/${foundPlea.fileName}`
      const fullFilePath = path.resolve(__dirname, 'assets', '.' + relativeFilePath)

      const expectedBaseDir = path.resolve(__dirname, 'assets/plea')
      const isSafePath = fullFilePath.startsWith(expectedBaseDir)

      if (!isSafePath) {
        throw new Error('Unsafe file path detected. Deletion aborted.')
      }

      if (fs.existsSync(fullFilePath)) {
        fs.unlinkSync(fullFilePath)
      } else {
        throw new Error('Plea proof not found.')
      }

      message = 'Plea deleted successfully'
      return true
    })

    if (!result) {
      return res.status(404).json(security.encrypt({ message }))
    }

    return res.status(200).json(security.encrypt({ message }))
  } catch (error: any) {
    console.error('Delete Plea Error:', error)
    const message = error instanceof Error ? error.message : 'Server error during deletion'
    return res.status(500).json(security.encrypt({ message }))
  } finally {
    session.endSession()
  }
}

export const updatePleaStatus = async (req: Request, res: Response) => {
  const session = await mongoose.startSession()
  try {
    const data = security.decrypt(req.body.body)
    const { id, action } = validateData('pleaStatusSchema', data);
    
    let message = '';
    const result = await session.withTransaction(async () => {
      const Plea = await plea.findOne({ _id: id }).session(session);
      if (!Plea) {
        message = `Plea not found`;
        return false;
      }

      const status = action ? 'approved' : 'rejected'

      Plea.status = status

      await Plea.save({session})

      message = `Successfully ${status} plea`

      await session.commitTransaction()
      return true;
    });

    if (!result) {
      return res.status(400).json(security.encrypt({ message }))
    }
    
    res.status(201).json(security.encrypt({message}))
  } catch (error: any) {
    console.error('Plea status Error:', error)
    res.status(500).json(security.encrypt({
      message: 'Server error while updating plea status',
      error: error.message || 'Unknown error',
    }))
  } finally {
    session.endSession()
  }
}