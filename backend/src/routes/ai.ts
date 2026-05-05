import { Router } from 'express';

const router = Router();

router.post('/generate-desc', async (req, res) => {
  try {
    const { productName, categoryName } = req.body;
    
    if (!productName) {
      return res.status(400).json({ message: 'productName is required' });
    }

    const prompt = `Buatkan deskripsi produk yang menarik untuk bahan masakan berikut. Fokuskan penjelasan pada karakteristik produk, kualitas, dan terutama MANFAAT KESEHATANNYA bagi tubuh. 
PENTING: Jangan sebutkan nama toko, merek, atau branding apapun (seperti "DapurGizi" atau "Toko Kami"). Bersikaplah objektif namun persuasif.

Nama Produk: ${productName}
Kategori: ${categoryName || 'Bahan Makanan'}

Format output HARUS DALAM HTML murni (gunakan <p>, <ul>, <li>, <b>, <i>). 
Tanpa markdown block (\`\`\`html). Langsung berikan string HTML-nya. Jangan terlalu panjang, maksimal 3 paragraf.`;

    const apiKey = process.env.KIMI_API_KEY;
    const baseUrl = process.env.AI_BASE_URL || 'https://api.moonshot.cn/v1';
    const aiModel = process.env.AI_MODEL || 'moonshot-v1-8k';
    
    if (!apiKey) {
      console.error('KIMI_API_KEY is missing from environment variables');
      return res.status(500).json({ message: 'Konfigurasi AI belum diatur di server.' });
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: 'system', content: 'Anda adalah ahli nutrisi dan asisten copywriter e-commerce yang berfokus menulis deskripsi produk bahan makanan secara objektif (tanpa menyebutkan branding toko) dalam format HTML.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Kimi API Error:', data);
      return res.status(500).json({ message: data.error?.message || 'Gagal generate AI' });
    }

    let htmlDesc = data.choices[0].message.content;
    
    // Clean up markdown code blocks if AI still outputs them
    if (htmlDesc.startsWith('```html')) {
      htmlDesc = htmlDesc.replace(/^```html\n?/, '').replace(/\n?```$/, '');
    } else if (htmlDesc.startsWith('```')) {
      htmlDesc = htmlDesc.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

  res.json({ description: htmlDesc });
  } catch (err: any) {
    console.error('AI Gen Error:', err);
    res.status(500).json({ message: 'Terjadi kesalahan internal saat memanggil AI.' });
  }
});

export default router;
