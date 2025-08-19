import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/user";
import bcrypt from "bcryptjs";
import { validateData } from "../utils/validate";
import * as security from "../utils/security";
import { generateNumber } from "../utils/unniversal";
import Course from "../models/course";

type Role = "Admin" | "Lecturer" | "Student";

export const registerUser = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    const decrypted: any = security.decrypt(req.body.body);
    const { role, regNo, nationalId, fullNames, password, courseCode, year } =
      validateData("registrationSchema", decrypted);
    
    let message = '';
    const result = await session.withTransaction(async () => {
      const exists = await User.findOne({ regNo }).session(session);
      if (exists) {
        message = `User ${regNo} already exists`;
        return false;
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);

      const userData: any = {
        role,
        regNo: regNo.toLowerCase(),
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

      await User.create([userData], { session });
      message = `User ${regNo} registered successfully`;
      return true;
    });

    if (!result) {
      return res.status(400).json(security.encrypt({ message }));
    }

    return res
      .status(201)
      .json(security.encrypt({ message }));
  } catch (err: any) {
    await session.abortTransaction();
    console.error("Transaction failed:", err.message);
    return res.status(400).json(
      security.encrypt({
        message: err.message || "Registration error",
        error: err,
      })
    );
  } finally {
    session.endSession();
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const decrypted = security.decrypt(req.body.body);
    const { regNo, password, role } = validateData("loginSchema", decrypted);

    const id = regNo.toLowerCase()
    const user = await User.findOne({ regNo: id });
    
    if (!user) {
      return res
        .status(404)
        .json(security.encrypt({ message: "User not found" }));
    }
    else if (role.toLowerCase() !== user.role.toLowerCase()) {
      return res
        .status(404)
        .json(security.encrypt({ message: `Invalid ${role.toLowerCase()}`}));
    }
    else if (user.blocked) {
      return res
        .status(404)
        .json(security.encrypt({ message: "User blocked. Contact Admin" }));
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json(security.encrypt({ message: "Invalid credentials" }));
    }

    return res
      .status(200)
      .json(security.encrypt({ message: "Login successful", user }));
  } catch (err: any) {
    console.error(err);
    return res.status(400).json(
      security.encrypt({
        message: err.message || "Login error",
        error: err,
      })
    );
  }
};
