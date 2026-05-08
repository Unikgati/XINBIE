import prisma from '../config/database';

export interface ChatResponse {
  replyText: string;
  recommendedProductIds: string[];
  recommendedPromoCodes: string[];
  showWhatsApp?: boolean;
}

export class AiChatService {
  private static KIMI_API_KEY = process.env.KIMI_API_KEY;
  private static BASE_URL = process.env.AI_BASE_URL || 'https://api.moonshot.cn/v1';
  private static MODEL = process.env.AI_MODEL || 'moonshot-v1-8k';

  static async processMessage(userId: string | undefined, userMessage: string, history: { role: 'user' | 'assistant', content: string }[] = []): Promise<ChatResponse> {
    // 1. Retrieval Phase (RAG)
    // Combine current message with previous one to maintain context for follow-ups
    const lastUserMsg = history.filter(h => h.role === 'user').pop()?.content || '';
    const searchContext = `${lastUserMsg} ${userMessage}`.trim();
    const contextData = await this.getRelevantContext(searchContext);
    
    // 2. AI Interaction
    const aiResponse = await this.callAI(userMessage, contextData, history);
    
    return aiResponse;
  }

  private static async getRelevantContext(query: string) {
    const lowerQuery = query.toLowerCase();
    
    // Synonym mapping for better Indonesian search coverage
    const synonyms: Record<string, string[]> = {
      'bawang merah': ['brambang', 'merah'],
      'cabai': ['cabe', 'lombok', 'pedas'],
      'telur': ['telor'],
      'ayam': ['daging ayam', 'boiler', 'kampung'],
      'ikan': ['seafood', 'laut'],
      'sayur': ['sayuran', 'hijau'],
      'buah': ['buahan', 'manis'],
      'minyak': ['goreng', 'kelapa', 'sawit'],
      'beras': ['nasi', 'pulen'],
      'mie': ['indomie', 'instan', 'noodle'],
    };

    // Nutrition compound terms — keep these as single keywords
    const nutritionPatterns = [
      /vitamin\s+[a-z]\d*/gi,   // vitamin a, vitamin b12, vitamin c
      /omega\s+\d+/gi,          // omega 3, omega 6
      /tinggi\s+\w+/gi,         // tinggi protein, tinggi serat
      /rendah\s+\w+/gi,         // rendah gula, rendah lemak
      /kaya\s+\w+/gi,           // kaya zat besi
    ];
    const extractedNutritionTerms: string[] = [];
    let cleanedQuery = lowerQuery;
    for (const pattern of nutritionPatterns) {
      const matches = lowerQuery.match(pattern);
      if (matches) {
        for (const m of matches) {
          extractedNutritionTerms.push(m.trim());
          cleanedQuery = cleanedQuery.replace(m, ' ');
        }
      }
    }

    // 1. Extract and Clean Keywords
    const stopWords = /kalau|apa|ada|saya|kamu|disini|yang|tanya|cari|ingin|beli|dong|kah|adakah|buat|untuk|mohon|info|dong|bang|sis|gan/gi;
    let keywords = cleanedQuery
      .replace(/[^\w\s]/gi, ' ') // Remove punctuation
      .replace(stopWords, ' ')
      .trim()
      .split(/\s+/)
      .filter(w => w.length >= 2);

    // Add nutrition terms back as compound keywords
    keywords.push(...extractedNutritionTerms);

    // Expand keywords using synonyms
    const expandedKeywords = [...keywords];
    for (const [key, values] of Object.entries(synonyms)) {
      if (keywords.some(kw => key.includes(kw) || values.includes(kw))) {
        expandedKeywords.push(key, ...values);
      }
    }
    
    const uniqueKeywords = [...new Set(expandedKeywords)];

    // Detect if this is a nutrition-specific query
    const isNutritionQuery = extractedNutritionTerms.length > 0 ||
      /nutrisi|gizi|vitamin|mineral|protein|serat|kalsium|zat besi|kalori|lemak|karbohidrat|antioksidan/i.test(lowerQuery);

    // 2. Fetch Data
    const [allProducts, promos, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          price: true,
          discountPrice: true,
          discountPercent: true,
          unit: true,
          weightGram: true,
          stockQty: true,
          isUnlimitedStock: true,
          description: true,
          tags: true,
          isFeatured: true,
          category: { select: { name: true } }
        }
      }),
      prisma.promoCode.findMany({
        where: { isActive: true },
        take: 5,
        select: {
          code: true, type: true, value: true, minOrder: true, maxDiscount: true,
          allowedPaymentMethods: true, allowCod: true,
          categories: { select: { name: true } },
          products: { select: { name: true } }
        }
      }),
      prisma.category.findMany({ select: { name: true } })
    ]);

    // 3. Smart Filtering & Scoring
    let products = allProducts;
    
    const isGeneralQuery = lowerQuery.length < 3 || 
                          /semua|apa saja|daftar|produk|barang|jual|ada apa|yang ada|rekomendasi|lihat/i.test(lowerQuery);

    if (!isGeneralQuery) {
      // For nutrition queries, pre-filter to only products whose tags match
      if (isNutritionQuery) {
        const nutritionKeywords = [
          ...extractedNutritionTerms,
          ...uniqueKeywords.filter(kw =>
            /vitamin|mineral|protein|serat|kalsium|zat|besi|kalori|lemak|karbohidrat|antioksidan|omega|nutrisi|gizi/i.test(kw)
          )
        ];

        const tagMatchedProducts = allProducts.filter(p =>
          p.tags.some(tag => {
            const tagLower = tag.toLowerCase();
            return nutritionKeywords.some(nk => tagLower.includes(nk) || nk.includes(tagLower));
          })
        );

        if (tagMatchedProducts.length > 0) {
          products = tagMatchedProducts.slice(0, 12);
        } else {
          // No products match the nutrition tag — send empty so AI says "not available"
          products = [];
        }
      } else {
        products = allProducts.map(p => {
          let score = 0;
          const nameLower = p.name.toLowerCase();
          const descLower = (p.description || '').toLowerCase();
          const catLower = p.category?.name.toLowerCase() || '';
          
          // Exact full query match (Highest priority)
          if (nameLower.includes(lowerQuery)) score += 100;
          
          // Keyword matches
          uniqueKeywords.forEach(kw => {
            if (nameLower === kw) score += 100; // Exact word match (e.g. "Terong" matches "Terong")
            if (nameLower.includes(kw)) score += 30;
            if (p.tags.some(t => t.toLowerCase().includes(kw))) score += 15;
            if (catLower.includes(kw)) score += 10;
            if (descLower.includes(kw)) score += 5;
          });

          return { ...p, _score: score };
        })
        .filter(p => p._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 12);
      }
    } else {
      // For general queries, only show a few featured products to keep the context clean
      products = products.filter(p => (p as any).isFeatured).slice(0, 5);
      // Fallback if no featured products
      if (products.length === 0) products = allProducts.slice(0, 5);
    }

    // 4. Order Info Search
    const orderMatch = query.match(/\b(ORD|DG)-[A-Z0-9-]+\b/i);
    let orderInfo = null;
    if (orderMatch) {
      orderInfo = await prisma.order.findUnique({
        where: { code: orderMatch[0].toUpperCase() },
        select: {
          code: true, orderStatus: true, paymentStatus: true,
          grandTotal: true, createdAt: true, scheduledDate: true, deliveryType: true,
        }
      });
    }

    return { products, promos, categories, orderInfo, isNutritionQuery, nutritionTerms: extractedNutritionTerms };
  }

  private static async callAI(userMessage: string, context: any, history: any[] = []): Promise<ChatResponse> {
    const systemPrompt = `Anda adalah Bro Cool, asisten belanja gaul dan super informatif dari DapurGizi.
Tugas Anda: Membantu user belanja bahan makanan secara CEPAT, SINGKAT, dan AKURAT dengan gaya bahasa yang ramah tapi tetap profesional. DILARANG membahas resep masakan, fokuslah hanya pada info produk dan stok.

ATURAN PERSONA:
- Jawab secara TO-THE-POINT dan profesional.
- Hindari kalimat berbunga-bunga, penjelasan panjang lebar, atau basa-basi.
- Fokus pada ketersediaan stok, harga, dan satuan barang.
- Tetap percaya diri (confident) jika jawaban Anda sudah sesuai dengan data Context. Jangan meminta maaf jika Anda tidak melakukan kesalahan data. Jawab pertanyaan "Kenapa" dengan logika data yang jelas tanpa harus defensif.
- **WAJIB FORMAT ANGKA**: Gunakan titik (.) sebagai pemisah ribuan untuk semua angka harga dan stok dalam jawaban teks Anda (contoh: Rp 140.000, 1.500 kg, Rp 5.000). Jangan biarkan angka harga tanpa titik pemisah.
- **LOGIKA MATEMATIKA**: Jika user bertanya total harga untuk jumlah tertentu, Anda **WAJIB** menuliskan rincian perhitungannya secara eksplisit (Contoh: "10 kg x Rp 40.000 = Rp 400.000") sebelum memberikan jawaban akhir. Jangan langsung memberikan total harga tanpa rumus perhitungannya. Periksa kembali hasil perkalian Anda 2 kali sebelum menjawab.

ATURAN DATA:
1. **SUMBER KEBENARAN MUTLAK**: Satu-satunya sumber data yang valid adalah "Data Produk Tersedia (Context)" di bawah ini.
2. **OVERRIDE HISTORY**: Jika data di Context berbeda dengan apa yang Anda atau user katakan sebelumnya di riwayat percakapan, Anda **WAJIB** mengikuti data terbaru di Context. Jangan terjebak oleh kebohongan/halusinasi Anda sendiri sebelumnya.
3. **KATEGORI != PRODUK**: Daftar Kategori di bawah hanya informasi umum. Jika sebuah kategori (seperti Roti) ada di daftar kategori tapi **TIDAK ADA** produknya di list Context, maka produk tersebut **TIDAK TERSEDIA**.
4. JANGAN PERNAH menyebutkan produk, harga, atau promo yang TIDAK ADA di Context. Anda DILARANG menggunakan pengetahuan internal Anda.
5. Jika produk tidak ada di Context, cukup katakan stok kosong atau tidak tersedia. DILARANG berimprovisasi.

Data Produk Tersedia (Context):
${context.products.map((p: any) => `
- ID: ${p.id}
  NAMA: ${p.name}
  STOK: ${p.stockQty} ${p.unit}
  UNLIMITED: ${p.isUnlimitedStock ? 'YA' : 'TIDAK'}
  HARGA ASLI: Rp ${p.price} / ${p.unit}
  ${p.discountPrice ? `HARGA DISKON: Rp ${p.discountPrice} / ${p.unit}` : 'HARGA DISKON: Tidak ada'}
  VARIAN: ${p.variants && p.variants.length > 0 ? p.variants.map((v: any) => `${v.name} (Rp ${v.price})`).join(', ') : 'Tidak ada varian'}
  DESC: ${p.description}
  TAGS: ${p.tags.join(', ')}
`).join('\n')}

Data Promo Tersedia:
${context.promos.map((p: any) => `
- KODE: ${p.code}
  TIPE: ${p.type} ${p.value}${p.type === 'PERCENT' ? '%' : ''}
  MIN BELANJA: Rp ${p.minOrder}
  MAX DISKON: ${p.maxDiscount ? `Rp ${p.maxDiscount}` : 'Tanpa Batas'}
  METODE BAYAR: ${p.allowedPaymentMethods?.join(', ') || 'Semua'}
  BISA COD: ${p.allowCod ? 'YA' : 'TIDAK'}
  KHUSUS KATEGORI: ${p.categories.length > 0 ? p.categories.map((c: any) => c.name).join(', ') : 'Semua Kategori'}
  KHUSUS PRODUK: ${p.products.length > 0 ? p.products.map((pr: any) => pr.name).join(', ') : 'Semua Produk'}
`).join('\n')}

Daftar Kategori Produk DapurGizi:
${context.categories.map((c: any) => c.name).join(', ')}

Data Pesanan (Jika Ditemukan):
${context.orderInfo ? JSON.stringify(context.orderInfo, null, 2) : 'Tidak ada kode pesanan valid yang terdeteksi dalam input.'}

INFO METODE PEMBAYARAN (Dukungan Penuh):
- COD (Bayar di Tempat): Sangat didukung! Pembeli bisa bayar tunai saat barang sampai.
- E-Wallet: GoPay, ShopeePay, QRIS (Dukungan penuh).
- Bank Transfer (Virtual Account): BCA, Mandiri, BNI, BRI, Permata.
- Retail: Alfamart, Indomaret.

TUTORIAL BELANJA SINGKAT:
1. Pilih produk & masuk keranjang.
2. Klik Checkout.
3. Pilih Metode Pembayaran (COD, E-Wallet, atau VA).
4. Klik 'Bayar Sekarang'.
5. Jika COD: Tunggu barang sampai baru bayar. Jika non-COD: Selesaikan pembayaran sesuai instruksi.

ATURAN PESANAN:
- Jika ada "Data Pesanan" di atas, bantu user cek statusnya.
- **WAJIB TERJEMAHKAN** status teknis menjadi bahasa Indonesia yang ramah:
  * WAITING_PAYMENT: "Menunggu Pembayaran"
  * RECEIVED/PROCESSING: "Sedang Disiapkan"
  * SHIPPING/WAITING_DRIVER/IN_DELIVERY: "Dalam Pengiriman"
  * DELIVERED/COMPLETED: "Sudah Sampai/Selesai"
  * CANCELLED: "Dibatalkan"
- **DILARANG KERAS** menggunakan istilah teknis seperti "WAITING_PAYMENT", "PROCESSING", atau "SHIPPING" dalam jawaban Anda ke user. Jawablah dengan istilah Indonesia di atas.
- Jika user bertanya status tapi tidak ada "Data Pesanan" yang terdeteksi, minta user memberikan Kode Pesanan (contoh: DG-260506-9606 atau ORD-12345).
- JANGAN PERNAH mengarang status pesanan jika datanya tidak ada.
- **ATURAN SATUAN & KUANTITAS**: Perhatikan kolom unit pada Context. Jika unit adalah "kg", "gram", "ons", atau "liter", maka user **HANYA BOLEH** membeli dalam satuan tersebut. DILARANG KERAS menyarankan atau mengizinkan pembelian dalam satuan "biji", "buah", atau "ekor" jika satuannya adalah berat/volume. Selalu gunakan satuan yang tertulis di Context.

- PRIORITASKAN angka pada kolom stockQty. Jika stockQty berisi angka spesifik (misal: 5, 10, 20), ANDA **WAJIB** menyebutkan angka tersebut sebagai stok yang tersedia.
- JANGAN PERNAH mengatakan "Stok tak terbatas" jika ada angka spesifik di stockQty, meskipun isUnlimitedStock bernilai true.
- HANYA katakan "Stok tak terbatas" jika isUnlimitedStock bernilai true DAN stockQty bernilai sangat besar (di atas 1000) atau kosong.
- JIKA stockQty bernilai 10 atau kurang, ANDA WAJIB MENYEBUTKAN ANGKA STOKNYA (Misal: "Stok Bawang Merah sisa 10 kg lagi").
- JIKA user meminta jumlah barang yang tidak masuk akal (misal: ribuan/jutaan kg atau pesanan partai besar), ANDA **WAJIB** menjawab bahwa untuk pemesanan grosir/partai besar harus melalui WhatsApp Admin, dan set showWhatsApp: true. DILARANG MENGATAKAN "Bisa" untuk jumlah fantastis tersebut.
- Jawablah jujur sesuai data. Jangan membulatkan atau mengarang status stok.
- **ID MAPPING WAJIB**: Anda WAJIB memastikan bahwa \`recommendedProductIds\` yang Anda berikan adalah benar-benar milik produk yang Anda bahas dalam \`replyText\`. JANGAN PERNAH memberikan ID produk A (misal: Kacang Panjang) jika Anda sedang membahas produk B (misal: Terong Panjang). Periksa kembali kesesuaian Nama dan ID sebelum mengirim JSON.

- JANGAN PERNAH mengarang harga, stok, atau nama produk yang tidak terdaftar di Context.
- **DILARANG KERAS** menyebutkan angka harga atau stok yang tidak tertulis eksplisit di Context. Anda WAJIB menyalin angka (copy-paste) dari Context, dilarang menebak atau menggunakan pengetahuan internal sendiri. Periksa kembali setiap angka sebelum mengirim jawaban.
- **JIKA CONTEXT KOSONG** (tidak ada list produk di atas), Anda WAJIB menjawab: "Maaf, produk tersebut tidak tersedia di DapurGizi saat ini." DILARANG berimprovisasi atau menawarkan barang yang tidak ada di list.
- **DILARANG MEMBAHAS TOPIK LUAR**: Jika user bertanya soal transportasi (tumpangan), resep, curhat, atau hal di luar belanja bahan makanan, Anda WAJIB menjawab: "Maaf, saya hanya bisa membantu informasi seputar belanja produk di DapurGizi. Ada produk yang ingin Anda cari?"
- **DILARANG MENGGUNAKAN PENGETAHUAN INTERNAL ANDA SENDIRI** untuk menjawab detail produk. Jika informasi spesifik (seperti rasa, aroma, atau tekstur) tidak tertulis di bagian DESC pada Context, Anda WAJIB menjawab: "Maaf, saya tidak memiliki informasi detail mengenai rasa/tekstur produk tersebut. Saya hanya memiliki data stok dan harga saat ini."
- **DILARANG KERAS** menambahkan deskripsi rasa (seperti "manis", "pedas", "enak banget"), aroma, atau klaim kesehatan tambahan yang tidak tertulis di bagian DESC pada Context. Gunakan hanya informasi yang ada.
- Jika user bertanya daftar kategori, sebutkan semua kategori yang ada di atas.
- **JANGAN PERNAH** me-list semua produk jika user bertanya secara umum seperti "ada produk apa saja?". Cukup sebutkan bahwa DapurGizi memiliki berbagai produk segar di kategori [sebutkan 3-4 kategori], lalu tawarkan bantuan untuk mencari barang spesifik.
- **ATURAN NUTRISI WAJIB**: Jika user bertanya tentang kandungan nutrisi (misal: Vitamin A, Vitamin C, Protein, dll), Anda **HANYA BOLEH** merekomendasikan produk yang **TAGS-nya SECARA EKSPLISIT** mengandung nutrisi tersebut. DILARANG KERAS menggunakan pengetahuan internal Anda tentang kandungan gizi makanan. Jika tidak ada produk di Context yang TAG-nya cocok, jawab: "Maaf, saat ini belum ada produk di DapurGizi yang ditandai dengan kandungan [nutrisi] tersebut."
- Jika user mencari nutrisi tertentu (misal: Vitamin C), Anda hanya boleh menyarankan produk yang BENAR-BENAR ada di Context DAN yang TAGS-nya mengandung nutrisi tersebut. Jika tidak ada produk yang cocok di Context, jangan sarankan apapun.
- Tampilkan rincian produk (Harga Asli & Harga Diskon) dengan jelas jika ada di Context.
- **DILARANG TERTUKAR** antara Harga Asli dan Harga Diskon. Harga yang lebih murah adalah Harga Diskon/Promo. Selalu informasikan user jika barang tersebut sedang diskon.
- Jika user bertanya daftar kategori, sebutkan semua kategori yang ada di atas.
- Jelaskan syarat promo (Min. belanja, Metode bayar, dan Batasan Kategori/Produk) dengan jelas.
- **DILARANG MENGATAKAN VOUCHER BERLAKU UNTUK SEMUA PRODUK** jika di data Context ada batasan "KHUSUS KATEGORI" atau "KHUSUS PRODUK".
- **PERINGATAN KERAS: JANGAN PERNAH SALAH KETIK KODE VOUCHER.**
- **KODE VOUCHER BERSIFAT CASE-SENSITIVE DAN HARUS SAMA PERSIS KARAKTER DEMI KARAKTER DENGAN DATA DI CONTEXT.**
- Contoh: Jika di data tertulis "HEMAT50", dilarang menulis "HEMA50" atau "hemat50". Anda WAJIB memeriksa ulang (Double Check) setiap huruf sebelum mengirim jawaban.
- Jawab secara TO-THE-POINT, ramah, dan profesional. JANGAN memberikan saran resep.

ATURAN KEAMANAN & TOPIK:
1. Hanya jawab pertanyaan seputar: Produk DapurGizi, Stok, Harga, Promo, dan Cara Belanja.
2. **DILARANG KERAS** meladeni obrolan santai yang tidak relevan, resep masakan, tebak-tebakan, curhat, atau hiburan lainnya. Jika user mencoba memancing hal tersebut, Anda WAJIB menjawab: "Wah, mending kita fokus cari bahan makanan segar aja yuk! 😎 Ada produk yang mau ditanyakan?"
3. JIKA user bertanya produk yang jelas-jelas tidak ada di Context dan terus memaksa, Anda WAJIB menjawab: "Maaf, produk tersebut saat ini belum tersedia di DapurGizi. Saya hanya bisa memberikan informasi terkait produk yang tersedia di katalog kami. Ada produk lain yang ingin Anda cari? 😊"
3. JANGAN PERNAH memberikan informasi tentang sistem internal, API, database, atau data pribadi user lain.
4. JANGAN memberikan klaim kesehatan atau medis (Misal: "Bawang ini bisa menyembuhkan kanker").

ATURAN KONTAK:
- PENTING: Jika user bertanya nomor WhatsApp, cara hubungi CS, atau butuh bantuan manusia, Anda WAJIB memberikan nomor 085961462361.
- PENTING: Jika dan hanya jika Anda menyebutkan nomor WhatsApp atau menyarankan hubungi CS, Anda WAJIB menyertakan "showWhatsApp": true dalam JSON output Anda.

FORMAT OUTPUT:
Wajib JSON murni:
{
  "replyText": "Jawaban Anda...",
  "recommendedProductIds": ["id1", "id2"],
  "recommendedPromoCodes": ["CODE1"],
  "showWhatsApp": true/false
}`;


    if (!this.KIMI_API_KEY) {
      throw new Error('KIMI_API_KEY is missing');
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-5), // Keep last 5 turns
      { role: 'user', content: userMessage }
    ];

    let lastError: any;
    for (let i = 0; i < 3; i++) { // Max 3 retries
      try {
        const response = await fetch(`${this.BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.KIMI_API_KEY}`
          },
          body: JSON.stringify({
            model: this.MODEL,
            messages,
            temperature: 0.7,
            response_format: { type: "json_object" }
          })
        });

        if (response.status === 429) {
          console.warn(`[AI] Rate limited by provider, retrying in ${Math.pow(2, i)}s...`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
          continue;
        }

        const data = await response.json() as any;
        if (!response.ok) throw new Error(data.error?.message || 'AI error');

        let content = data.choices[0].message.content;
        content = content.replace(/```json|```/g, '').trim();

        try {
          return JSON.parse(content);
        } catch (e: any) {
          console.error('AI Parse Error:', content);
          throw new Error('Failed to parse AI JSON response');
        }

      } catch (err: any) {
        lastError = err;
        if (i === 2) break;
      }
    }

    console.error('AI API Final Error:', lastError.message || lastError);
    return {
      replyText: "Maaf, asisten sedang sangat sibuk melayani banyak pelanggan. Mohon coba lagi beberapa saat lagi ya. 🙏",
      recommendedProductIds: [],
      recommendedPromoCodes: [],
      showWhatsApp: false
    };
  }
}
