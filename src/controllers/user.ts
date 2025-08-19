import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import User from '../models/user'
import { validateData } from '../utils/validate'
import * as security from '../utils/security'
import { generateNumber } from '../utils/unniversal'
import Course from '../models/course'

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find({}, '-password')
    res.status(200).json(security.encrypt(users))
  } catch (error: any) {
    console.error('Get Users Error:', error)
    res.status(500).json(security.encrypt({
      message: 'Server error while fetching users',
      error: error.message || 'Unknown error',
    }))
  }
}

export const updateUser = async (req: Request, res: Response) => {
  const session = await mongoose.startSession()
  try {
    const data = security.decrypt(req.body.body)
    const { role, regNo, nationalId, fullNames, password, courseCode, year } =
      validateData("registrationSchema", data);
    
    let message = '';
    const result = await session.withTransaction(async () => {
      const exists = await User.findOne({ regNo }).session(session);
      if (!exists) {
        message = `User ${regNo} not found`;
        return false;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userData: any = {
        role,
        regNo,
        nationalId,
        fullNames,
        password: hashedPassword,
      };

      if (role.toLowerCase() === "admin" && !nationalId) {
        userData.nationalId = generateNumber(8);
      }

      if (role.toLowerCase() === "student") {
        userData.year = year
      }

      if ((role.toLowerCase() === "lecturer" || role.toLowerCase() === "student") && courseCode) {
        const code = courseCode.trim().toLowerCase();
        const title = await Course.findOne({ courseCode: code }).session(session);
        if (!title) {
          message = `Course ${code} does not exist`;
          return false;
        }

        userData.courseCode = code;
        userData.courseTitle = title.courseTitle;
      }

      const update = await User.findOneAndUpdate(
        { regNo }, userData, { new: true, session }
      )

      if (!update) {
        message = `Failed to update user ${regNo} not found`;
        return false;
      }

      message = `Successfully updated user ${regNo}`

      await session.commitTransaction()
      return true;
    });

    if (!result) {
      return res.status(400).json(security.encrypt({ message }))
    }
    
    res.status(201).json(security.encrypt({message}))
  } catch (error: any) {
    console.error('Update User Error:', error)
    res.status(500).json(security.encrypt({
      message: 'Server error while updating user',
      error: error.message || 'Unknown error',
    }))
  } finally {
    session.endSession()
  }
}

export const blockUser = async (req: Request, res: Response) => {
  const session = await mongoose.startSession()
  try {
    const data = security.decrypt(req.body.body)
    const { regNo, action } = validateData('blockSchema', data);
    
    let message = '';
    const result = await session.withTransaction(async () => {
      const user = await User.findOne({ regNo }).session(session);
      if (!user) {
        message = `User ${regNo} not found`;
        return false;
      }

      user.blocked = action;
      await user.save({ session })

      const block = action ? 'blockerd' : 'unblocked'

      message = `Successfully ${block} user ${regNo}`

      await session.commitTransaction()
      return true;
    });

    if (!result) {
      return res.status(400).json(security.encrypt({ message }))
    }
    
    res.status(201).json(security.encrypt({message}))
  } catch (error: any) {
    console.error('Block User Error:', error)
    res.status(500).json(security.encrypt({
      message: 'Server error while blocking user',
      error: error.message || 'Unknown error',
    }))
  } finally {
    session.endSession()
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  const session = await mongoose.startSession()
  try {
    let message = '';
    const data = security.decrypt(req.body.body)
    const { regNo } = validateData('deleteSchema', data);
    
    if(!regNo) {
      res.status(404).json(security.encrypt({message: 'Invalid regstration number'}))
    }
    const result = await session.withTransaction(async () => {
      const deleteUser = await User.findOneAndDelete({ regNo }).session(session);
      if (!deleteUser) {
        message = `User ${regNo} not found`;
        return false;
      }

      message = `Successfully deleted user ${regNo}`

      await session.commitTransaction()
      return true;
    });

    if (!result) {
      return res.status(400).json(security.encrypt({ message }))
    }
    
    res.status(201).json(security.encrypt({message}))
  } catch (error: any) {
    console.error('Delete User Error:', error)
    res.status(500).json(security.encrypt({
      message: 'Server error while deleting user',
      error: error.message || 'Unknown error',
    }))
  } finally {
    session.endSession()
  }
}