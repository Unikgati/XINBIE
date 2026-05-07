import { Router } from 'express';
import { AiChatService } from '../services/aiChatService';
import prisma from '../config/database';

const router = Router();

/**
 * WhatsApp Webhook Handler (Example for Meta/Twilio)
 * This would receive POST requests from the WhatsApp API provider.
 */
router.post('/webhook', async (req, res) => {
  try {
    // 1. Extract message and sender info
    // Format depends on the provider (Twilio vs Meta)
    const { from, body } = req.body; 

    if (!from || !body) return res.sendStatus(400);

    // 2. Identify user by phone number
    const user = await prisma.user.findFirst({
      where: { phoneWa: from }
    });

    if (!user) {
      // Logic for guest or welcome message
    }

    // 3. Gatekeeper / Security
    // (Sanitization already handled in AiChatService logic potentially)

    // 4. Process with AI Service
    const aiResponse = await AiChatService.processMessage(user?.id || 'guest', body);

    // 5. Format response for WhatsApp
    // WhatsApp usually only supports text, images, or interactive buttons (List/Buttons)
    // We can't send "React Cards", but we can send a nice formatted text with links.
    
    let whatsappText = aiResponse.replyText;
    
    if (aiResponse.recommendedProductIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: aiResponse.recommendedProductIds } },
        take: 2
      });
      
      whatsappText += "\n\n📦 Rekomendasi Produk:\n";
      products.forEach(p => {
        whatsappText += `- ${p.name} (Rp ${p.price.toLocaleString('id-ID')})\n  Cek di sini: https://dapurgizi.id/product/${p.slug}\n`;
      });
    }

    if (aiResponse.recommendedPromoCodes.length > 0) {
      whatsappText += `\n🎫 Pakai Kode Promo: ${aiResponse.recommendedPromoCodes.join(', ')}`;
    }

    // 6. Send back to WhatsApp API
    // await sendToWhatsAppAPI(from, whatsappText);

    console.log(`[WA] To: ${from} | Msg: ${whatsappText}`);
    
    res.json({ success: true });

  } catch (err) {
    console.error('WA Webhook Error:', err);
    res.sendStatus(500);
  }
});

export default router;
