import { Router } from 'express';
import { AiChatService } from '../services/aiChatService';
import { AuthRequest, optionalAuth } from '../middleware/auth';
import prisma from '../config/database';

import redis from '../config/redis';

const router = Router();

const GUEST_LIMIT = 5; // 5 chats per hour for guests
const REGISTERED_LIMIT = 20; // 20 chats per hour for logged in users
const WINDOW = 60 * 60; // 1 hour in seconds

router.get('/status', (req, res) => {
  const isOnline = !!process.env.KIMI_API_KEY;
  res.json({ online: isOnline });
});

router.post('/message', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { message, history } = req.body;
    const userId = req.userId;
    const ip = req.ip;

    if (!message || message.length < 2) {
      return res.status(400).json({ message: 'Pesan terlalu pendek' });
    }

    // Redis Rate Limiting
    const limit = userId ? REGISTERED_LIMIT : GUEST_LIMIT;
    const identifier = userId || ip;
    const redisKey = `ratelimit:ai_chat:${identifier}`;
    const currentUsage = await redis.incr(redisKey);
    
    if (currentUsage === 1) {
      await redis.expire(redisKey, WINDOW);
    }

    if (currentUsage > limit) {
      return res.status(429).json({ 
        message: `Batas chat gratis Anda (${limit}/jam) sudah habis. Silakan login atau hubungi Customer Service kami via WhatsApp untuk bantuan langsung: https://wa.me/6287794204259` 
      });
    }

    // Process with AI
    const result = await AiChatService.processMessage(userId, message, history);

    // Enrich recommendations with full product/promo details if IDs are provided
    let products: any[] = [];
    const productIds = result.recommendedProductIds || [];
    if (productIds.length > 0) {
      products = await prisma.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        select: { 
          id: true, name: true, price: true, discountPrice: true, images: true, slug: true,
          category: { select: { name: true } },
          flashSaleItems: {
            where: {
              flashSale: {
                isActive: true,
                startAt: { lte: new Date() },
                endAt: { gte: new Date() }
              }
            },
            select: {
              flashPrice: true
            }
          }
        }
      });
    }

    let promos: any[] = [];
    const promoCodes = result.recommendedPromoCodes || [];
    if (promoCodes.length > 0) {
      promos = await prisma.promoCode.findMany({
        where: { code: { in: promoCodes }, isActive: true },
        select: { code: true, value: true, type: true, minOrder: true }
      });
    }

    res.json({
      replyText: result.replyText,
      recommendations: {
        products,
        promos,
        showWhatsApp: result.showWhatsApp
      }
    });

  } catch (err: any) {
    console.error('Chat Error:', err);
    res.status(500).json({ message: 'Maaf, terjadi gangguan pada sistem AI.' });
  }
});

export default router;
