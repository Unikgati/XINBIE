import { Router } from 'express';

const router = Router();

router.post('/generate-desc', async (req, res) => {
  try {
    const { productName, categoryName } = req.body;
    
    if (!productName) {
      return res.status(400).json({ message: 'productName is required' });
    }

    const prompt = `Buatkan deskripsi produk dan rekomendasi bahan masakan pelengkap untuk:
Nama Produk: ${productName}
Kategori: ${categoryName || 'Bahan Makanan'}

Fokuskan deskripsi pada karakteristik produk, kualitas, dan MANFAAT KESEHATANNYA.
Jangan sebutkan nama toko, merek, atau branding apapun. Format deskripsi harus HTML murni (gunakan <p>, <ul>, <li>, <b>). Maksimal 3 paragraf.

Kemudian, pikirkan 3-5 jenis bahan masakan riil lain yang sangat cocok dimasak bersama bahan ini (sebagai barang rekomendasi cross-selling, misal: penyedap rasa, saus, mentega, keju, arang, atau pelengkap lainnya).

PENTING: KEMBALIKAN OUTPUT HANYA DALAM BENTUK JSON murni (TANPA markdown \`\`\`json) dengan format persis seperti ini:
{
  "description": "<p>Deskripsi html di sini...</p>",
  "relatedKeywords": ["mentega", "keju", "bumbu", "saus"]
}`;

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
          { role: 'system', content: 'Anda adalah AI asisten e-commerce yang merespon secara eksklusif dalam format JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Kimi API Error:', data);
      return res.status(500).json({ message: data.error?.message || 'Gagal generate AI' });
    }

    let jsonOutput = data.choices[0].message.content;
    
    // Clean up markdown code blocks if AI still outputs them
    if (jsonOutput.startsWith('```json')) {
      jsonOutput = jsonOutput.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonOutput.startsWith('```')) {
      jsonOutput = jsonOutput.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    try {
      const parsed = JSON.parse(jsonOutput);
      res.json({
        description: parsed.description || '',
        relatedKeywords: parsed.relatedKeywords || []
      });
    } catch (e) {
      console.error("Failed to parse AI JSON:", e, "Raw output:", jsonOutput);
      // Fallback in case of parsing error
      res.json({ description: jsonOutput, relatedKeywords: [] });
    }
  } catch (err: any) {
    console.error('AI Gen Error:', err);
    res.status(500).json({ message: 'Terjadi kesalahan internal saat memanggil AI.' });
  }
});

export default router;
