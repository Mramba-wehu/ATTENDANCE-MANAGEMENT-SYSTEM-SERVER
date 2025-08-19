import { Request, Response } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';
import * as security from '../utils/security';
import note from '../models/note';
import { validateData } from '../utils/validate';

export const getNotes = async (req: Request, res: Response) => {
  const session = await mongoose.startSession()
  try {
    let message = '';
    const decrypted = security.decrypt(req.body.body);
    const { courseCode } = decrypted;
    if (!courseCode) {
      return res.status(400).json(security.encrypt({ message: 'Invalid course code' }));
    }

    const result = await session.withTransaction(async () => {

      const notes = await note.find({ courseCode }).session(session);
      if (!notes || notes.length < 1) {
        message = `Notes not found`;
        return false;
      }

      await session.commitTransaction()

      return res.status(200).json(security.encrypt({ notes }));
    });

    if (!result) {
      return res.status(404).json(security.encrypt({ message }));
    }
  }  catch (error: any) {
    console.error('Fetch Notes Error:', error)
    res.status(500).json(security.encrypt({
      message: 'Server error while getting notes',
      error: error.message || 'Unknown error',
    }))
  } finally {
    session.endSession();
  }
}

export const newNote = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    if (!req.file) {
      return res.status(400).json(security.encrypt({ message: 'No file uploaded' }));
    }

    const decrypted = security.decrypt(JSON.parse(req.body.body));
    const { courseCode, unitCode } = validateData('notesSchema', decrypted);

    const mimeType = req.file.mimetype;
    const fileType = mime.extension(mimeType);

    if (fileType !== 'pdf') {
      return res.status(400).json(security.encrypt({ message: 'Only PDF files are allowed' }));
    }

    const folder = 'pdf';
    const destFolder = path.join(__dirname, '../assets/notes', folder);
    const destPath = path.join(destFolder, req.file.originalname);
    const webUrl = `/notes/${folder}/${req.file.originalname}`;

    if (fs.existsSync(destPath)) {
      return res.status(404).json(security.encrypt({
        message: 'A file with this name already exists. Please rename your file or choose a different one.',
      }));
    }

    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }

    const uploadedFile = req.file;

    await session.withTransaction(async () => {
      const existing = await note.findOne({ courseCode, unitCode }).session(session);
      if (existing) {
        throw new Error('Notes for this unit already exist');
      }

      const newNoteDoc = new note({
        courseCode,
        unitCode,
        fileName: uploadedFile.originalname,
        fileUrl: webUrl,
      });

      await newNoteDoc.save({ session });

      try {
        fs.copyFileSync(uploadedFile.path, destPath);
      } catch (copyError) {
        console.error('File copy failed:', copyError);
        throw new Error('File copy failed. Transaction rolled back.');
      }
    });

    res.status(201).json(security.encrypt({ message: 'Note uploaded successfully' }));
  } catch (error: any) {
    console.error('New Note Error:', error);
    const message = error instanceof Error ? error.message : 'Server error during note upload';
    res.status(500).json(security.encrypt({ message }));
  } finally {
    session.endSession();
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const decrypted = security.decrypt(req.body.body);
    const { unitCode } = validateData('deleteNoteSchema', decrypted);

    let message = '';

    const result = await session.withTransaction(async () => {
      const foundNote = await note.findOne({ unitCode }).session(session);
      if (!foundNote) {
        message = 'Note not found';
        return false;
      }

      const deletion = await note.findOneAndDelete({ unitCode }).session(session);
      if (!deletion) {
        message = 'Failed to delete note from database';
        return false;
      }

      const relativeFilePath = foundNote.fileUrl;
      const fullFilePath = path.resolve(__dirname, 'assets', '.' + relativeFilePath);

      const expectedBaseDir = path.resolve(__dirname, 'assets/notes/pdf');

      const isInsideNotes = fullFilePath.startsWith(expectedBaseDir);

      if (!isInsideNotes) {
        throw new Error('Unsafe file path detected. Deletion aborted.');
      }

      try {
        if (fs.existsSync(fullFilePath)) {
          fs.unlinkSync(fullFilePath);
          console.log('File successfully deleted.');
        } else {
          console.log('File does not exist on disk.');
        }
      } catch (fileErr) {
        console.error('File deletion failed:', fileErr);
        throw new Error('File deletion failed. Transaction rolled back.');
      }

      message = 'Note deleted successfully';
      return true;
    });

    if (!result) {
      return res.status(404).json(security.encrypt({ message }));
    }

    return res.status(200).json(security.encrypt({ message }));
  } catch (error: any) {
    console.error('Delete Note Error:', error);
    const message = error instanceof Error ? error.message : 'Server error during deletion';
    return res.status(500).json(security.encrypt({ message }));
  } finally {
    session.endSession();
  }
};