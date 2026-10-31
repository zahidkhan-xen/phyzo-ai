import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { z } from "zod";
import { adminEmails } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { clearAuthCookie, setAuthCookie } from "../utils/cookies.js";
import { signAuthToken } from "../utils/jwt.js";
import { serializeUser } from "../utils/serialize.js";
import { validate } from "../utils/validate.js";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(128),
});

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().toLowerCase().email().max(200).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = validate(registerSchema, req.body);

  const existing = await User.findOne({ email }).select("_id");
  if (existing) {
    throw ApiError.conflict("An account with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const role = adminEmails.includes(email) ? "admin" : "student";

  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
  });

  setAuthCookie(res, signAuthToken({ sub: String(user._id), role: user.role }));

  res.status(201).json({ user: serializeUser(user.toObject()) });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = validate(loginSchema, req.body);

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  setAuthCookie(
    res,
    signAuthToken({ sub: String(user._id), role: user.role }),
  );

  res.json({ user: serializeUser(user.toObject()) });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  clearAuthCookie(res);
  res.json({ message: "Signed out." });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  res.json({ user: serializeUser(req.user.toObject()) });
}

export async function updateProfile(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();

  const data = validate(profileSchema, req.body);

  if (data.email && data.email !== req.user.email) {
    const existing = await User.findOne({
      email: data.email,
      _id: { $ne: req.user._id },
    }).select("_id");

    if (existing) {
      throw ApiError.conflict("That email is already in use.");
    }
  }

  if (data.name !== undefined) req.user.name = data.name;
  if (data.email !== undefined) req.user.email = data.email;

  await req.user.save();

  res.json({ user: serializeUser(req.user.toObject()) });
}

export async function changePassword(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();

  const { currentPassword, newPassword } = validate(passwordSchema, req.body);

  const user = await User.findById(req.user._id).select("+passwordHash");
  if (!user) throw ApiError.unauthorized();

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    throw ApiError.badRequest("Your current password is incorrect.");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  res.json({ message: "Password updated." });
}
