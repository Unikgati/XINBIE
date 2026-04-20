import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('❌ Error:', err.message || err);

  if (err.name === 'ValidationError') {
    return res.status(422).json({ message: 'Validasi gagal', errors: err.errors });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'Data sudah ada (duplicate)' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Data tidak ditemukan' });
  }

  const status = err.statusCode || err.status || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  res.status(status).json({ message });
}

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
