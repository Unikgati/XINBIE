import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import prisma from '../config/database';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import { generateOtp } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { sendOTP } from '../utils/mailer';
import redis from '../config/redis';
import { AuthRequest } from '../middleware/auth';
import { sendOTP } from '../utils/mailer';

// POST /api/auth/register
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email sudah terdaftar', 409);

    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP
    const otp = generateOtp();

    // Store in Redis (valid for 10 minutes)
    const pendingData = {
      name,
      email,
      password: hashedPassword,
      otp,
      attempts: 0
    };
    
    await redis.setex(`register:${email}`, 600, JSON.stringify(pendingData));

    // Send OTP via email
    await sendOTP(email, otp, 'EMAIL_VERIFICATION');
    console.log(`📧 OTP for ${email}: ${otp}`);

    res.status(201).json({
      message: 'Registrasi berhasil. Cek email untuk verifikasi.',
      email,
    });
  } catch (err) { next(err); }
}

// POST /api/auth/verify-email
export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, otp } = req.body;

    const pendingStr = await redis.get(`register:${email}`);
    if (!pendingStr) throw new AppError('Sesi pendaftaran kadaluarsa atau tidak ditemukan, silakan daftar ulang', 400);

    const pendingData = JSON.parse(pendingStr);

    if (pendingData.attempts >= 5) {
      await redis.del(`register:${email}`);
      throw new AppError('Terlalu banyak percobaan OTP, silakan daftar ulang', 429);
    }

    if (pendingData.otp !== otp) {
      pendingData.attempts += 1;
      await redis.setex(`register:${email}`, 600, JSON.stringify(pendingData));
      throw new AppError('OTP salah', 400);
    }

    // Check if user somehow registered in the meantime
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await redis.del(`register:${email}`);
      throw new AppError('Email sudah terdaftar', 409);
    }

    // Insert to DB
    user = await prisma.user.create({
      data: { 
        name: pendingData.name, 
        email: pendingData.email, 
        password: pendingData.password,
        emailVerifiedAt: new Date()
      },
    });

    await redis.del(`register:${email}`);

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      accessToken,
      refreshToken,
      user: sanitizeUser(user),
    });
  } catch (err) { next(err); }
}

// POST /api/auth/login
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) throw new AppError('Email atau password salah', 401);
    if (!user.isActive) throw new AppError('Akun dinonaktifkan', 403);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError('Email atau password salah', 401);

    if (!user.emailVerifiedAt) {
      throw new AppError('Email belum diverifikasi', 403);
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ accessToken, refreshToken, user: sanitizeUser(user) });
  } catch (err) { next(err); }
}

// POST /api/auth/google
export async function googleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const { idToken, name, email, avatarUrl, googleId } = req.body;
    // In production: verify idToken with Google. For now, trust client.

    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const updateData: any = { googleId, emailVerifiedAt: new Date() };
        // Hanya ganti foto profil ke bawaan Google JIKA foto saat ini kosong
        if (!user.avatarUrl) {
          updateData.avatarUrl = avatarUrl;
        }
        
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      } else {
        user = await prisma.user.create({
          data: { name, email, googleId, avatarUrl, emailVerifiedAt: new Date() },
        });
      }
    }

    if (!user.isActive) throw new AppError('Akun dinonaktifkan', 403);

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ accessToken, refreshToken, user: sanitizeUser(user) });
  } catch (err) { next(err); }
}

// POST /api/auth/refresh
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw new AppError('Refresh token required', 400);

    const record = await prisma.refreshToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      if (record) await prisma.refreshToken.delete({ where: { id: record.id } });
      throw new AppError('Refresh token expired', 401);
    }

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new AppError('User tidak ditemukan', 404);

    // Rotate tokens
    await prisma.refreshToken.delete({ where: { id: record.id } });

    const accessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id, user.role);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) { next(err); }
}

// POST /api/auth/forgot-password
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak user existence
      return res.json({ message: 'Jika email terdaftar, OTP akan dikirim' });
    }

    const otp = generateOtp();
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code: otp,
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOTP(email, otp, 'PASSWORD_RESET');
    console.log(`📧 Password reset OTP for ${email}: ${otp}`);
    res.json({ message: 'Jika email terdaftar, OTP akan dikirim' });
  } catch (err) { next(err); }
}

// POST /api/auth/verify-reset-otp
export async function verifyResetOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('User tidak ditemukan', 404);

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new AppError('OTP tidak valid atau sudah kadaluarsa', 400);
    }

    if (otpRecord.attempts >= 5) {
      throw new AppError('Terlalu banyak percobaan salah. Silakan minta OTP baru.', 429);
    }

    if (otpRecord.code !== otp) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new AppError('OTP salah', 400);
    }

    // If valid, just return success so frontend can proceed to the reset password screen
    res.json({ message: 'OTP valid' });
  } catch (err) { next(err); }
}

// POST /api/auth/reset-password
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, otp, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('User tidak ditemukan', 404);

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new AppError('OTP tidak valid atau sudah kadaluarsa', 400);
    }

    if (otpRecord.attempts >= 5) {
      throw new AppError('Terlalu banyak percobaan salah. Silakan minta OTP baru.', 429);
    }

    if (otpRecord.code !== otp) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new AppError('OTP salah', 400);
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.otpCode.update({ where: { id: otpRecord.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
      prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);

    res.json({ message: 'Password berhasil direset' });
  } catch (err) { next(err); }
}

// POST /api/auth/resend-otp
export async function resendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, type } = req.body;
    
    if (type !== 'password_reset') {
      // It's for EMAIL_VERIFICATION -> Check Redis
      const pendingStr = await redis.get(`register:${email}`);
      if (!pendingStr) {
        throw new AppError('Sesi pendaftaran tidak ditemukan atau sudah kadaluarsa', 404);
      }
      
      const pendingData = JSON.parse(pendingStr);
      const otp = generateOtp();
      pendingData.otp = otp;
      
      await redis.setex(`register:${email}`, 600, JSON.stringify(pendingData));
      await sendOTP(email, otp, 'EMAIL_VERIFICATION');
      
      console.log(`📧 Resend OTP (Registration) for ${email}: ${otp}`);
      return res.json({ message: 'OTP baru telah dikirim' });
    }

    // It's for PASSWORD_RESET -> Check PostgreSQL
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('User tidak ditemukan', 404);

    const otp = generateOtp();

    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code: otp,
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOTP(email, otp, 'PASSWORD_RESET');
    console.log(`📧 Resend OTP (Password Reset) for ${email}: ${otp}`);
    res.json({ message: 'OTP baru telah dikirim' });
  } catch (err) { next(err); }
}

// GET /api/auth/me
export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) throw new AppError('User tidak ditemukan', 404);
    res.json(sanitizeUser(user));
  } catch (err) { next(err); }
}

// PUT /api/auth/profile
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, phoneWa } = req.body;
    let avatarUrl: string | undefined;

    console.log(`[updateProfile] req.file:`, req.file ? `File present (${req.file.mimetype})` : 'No file');

    if (req.file) {
      const { processAndUploadImage } = await import('../middleware/upload');
      avatarUrl = await processAndUploadImage(req.file, 'avatars');
    }

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(name && { name }),
        ...(phoneWa && { phoneWa }),
        ...(avatarUrl && { avatarUrl }),
      },
    });

    res.json(sanitizeUser(updated));
  } catch (err) { next(err); }
}

// PUT /api/auth/fcm-token
export async function updateFcmToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { fcmToken: req.body.fcmToken },
    });
    res.json({ message: 'FCM token updated' });
  } catch (err) { next(err); }
}

// POST /api/auth/logout
export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.refreshToken.deleteMany({ where: { userId: req.userId } });
    await prisma.user.update({ where: { id: req.userId }, data: { fcmToken: null } });
    res.json({ message: 'Logged out' });
  } catch (err) { next(err); }
}

function sanitizeUser(user: any) {
  const { password, ...rest } = user;
  return rest;
}
