import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Course from '../models/course';
import Unit from '../models/unit'
import * as security from '../utils/security';
import { validateData } from '../utils/validate';

export const getCourses = async (_req: Request, res: Response) => {
  try {
    const courses = await Course.find();
    res.json(security.encrypt(courses));
  } catch (err) {
    res.status(500).json(security.encrypt({
      message: 'Failed to retrieve courses',
      error: err,
    }));
  }
};

export const createCourse = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const data = security.decrypt(req.body.body);
    const { courseCode, courseTitle, courseLevel } = validateData('courseSchema', data);

    let message = '';

    const result = await session.withTransaction(async () => {
      const existingCourse = await Course.findOne({ courseCode }).session(session);
      if (existingCourse) {
        message = 'Course already exists';
        return false;
      }

      const title = `${courseLevel} in ${courseTitle}`
      const newCourse = new Course({courseCode: courseCode.toLowerCase(), courseTitle: title.toLowerCase(), courseLevel: courseLevel.toLowerCase()});

      await newCourse.save({ session });

      message = `Course ${title} registered successfully`;
      await session.commitTransaction()
      return true;
    });

    if (!result) {
      return res.status(400).json(security.encrypt({ message }));
    }

    return res.status(201).json(security.encrypt({ message }));
  } catch (err: any) {
    console.error('Transaction failed:', err.message);
    return res.status(500).json(security.encrypt({
      message: 'Failed to create course',
      error: err.message || err,
    }));
  } finally {
    session.endSession();
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const data = security.decrypt(req.body.body);
    const { courseCode, courseTitle, courseLevel } = validateData('courseSchema', data);

    let message = '';

    const result = await session.withTransaction(async () => {

      const updated = await Course.findOneAndUpdate(
        { courseCode: courseCode.toLowerCase() },
        {
          courseCode: courseCode.toLowerCase(),
          courseTitle: courseTitle.toLowerCase(),
          courseLevel: courseLevel.toLowerCase(),
        },
        { new: true, session }
      );

      if (!updated) {
        message = 'Course not found';
        return false;
      }

      message = `Course ${courseTitle} updated successfully`;
      
      await session.commitTransaction()
      return true;
    });

    if (!result) {
      console.log(message)
      return res.status(404).json(security.encrypt({ message }));
    }

    return res.status(200).json(security.encrypt({ message }));
  } catch (err: any) {
    console.error('Transaction failed:', err.message);
    return res.status(500).json(security.encrypt({
      message: 'Failed to update course',
      error: err.message,
    }));
  } finally {
    session.endSession();
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    let message = '';
    const decrypted = security.decrypt(req.body.body);
    const { courseCode } = validateData('commonSchema', decrypted);

    if (!courseCode) {
      return res.status(400).json(security.encrypt({ message: 'Invalid course code' }));
    }

    const result = await session.withTransaction(async () => {
      await Unit.deleteMany({ courseCode }).session(session);

      const courseDeleteResult = await Course.findOneAndDelete({ courseCode }).session(session);

      if (!courseDeleteResult) {
        message = `Course not found`;
        return false;
      }

      message = `Course and associated units deleted successfully`;
      return true;
    });

    if (!result) {
      return res.status(404).json(security.encrypt({ message }));
    }

    return res.status(200).json(security.encrypt({ message }));
  } catch (error: any) {
    console.error('Delete Course Error:', error);
    return res.status(500).json(security.encrypt({
      message: 'Server error while deleting course',
      error: error.message || 'Unknown error',
    }));
  } finally {
    session.endSession();
  }
};