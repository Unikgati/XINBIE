import { Router } from 'express';

const router = Router();

router.post('/generate-desc', async (req, res) => {
  try {
    const { productName, categoryName } = req.body;
    
    if (!productName) {
      return res.status(400).json({ message: 'productName is required' });
    }

    const prompt = `Buat deskripsi produk untuk marketplace (XINBIE).

Nama Produk: ${productName}
Kategori: ${categoryName || 'Produk'}

Aturan Penulisan (WAJIB DIIKUTI):
- Maksimal 2 paragraf, dengan total hanya 2–3 kalimat saja (singkat dan padat).
- Fokus pada: kandungan nutrisi, spesifikasi, atau karakteristik fisik produk (harus berdasarkan fakta umum).
- Gunakan fakta umum secara akurat.
- JANGAN berikan klaim medis/obat.
- Bahasa sederhana, natural, tidak berlebihan, dan tidak puitis.
- Hindari pengulangan fungsi produk atau kata-kata yang tidak perlu.
- TIDAK BOLEH menyebutkan nama brand/merek apapun termasuk "XINBIE" atau "Dapurgizi".
- TIDAK BOLEH menggunakan bullet point (<ul> atau <li>).
- Format deskripsi harus teks biasa (PLAIN TEXT), dilarang menggunakan tag HTML apapun. Gunakan newline (\n) untuk pemisah paragraf jika diperlukan.
- PENTING: JANGAN menambahkan informasi operasional seperti jam buka toko, jadwal pengiriman (Senin-Sabtu), atau kebijakan retur. Fokuslah hanya pada deskripsi produk itu sendiri.

Kemudian, pikirkan 3-5 jenis bahan masakan atau produk riil lain yang sangat cocok digunakan bersama produk ini (sebagai barang rekomendasi cross-selling).

PENTING: KEMBALIKAN OUTPUT HANYA DALAM BENTUK JSON murni (TANPA markdown \`\`\`json) dengan format persis seperti ini:
{
  "description": "Teks deskripsi produk tanpa tag HTML...",
  "relatedKeywords": ["keyword1", "keyword2", "keyword3"]
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

    const data = await response.json() as any;
    
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
