import prisma from '../config/database';

/**
 * Seed NTB region data with embedded static data.
 * No network required — data hardcoded from emsifa/api-wilayah-indonesia.
 * Villages fetched on-demand via API proxy.
 *
 * Run: npx ts-node src/seeds/seedRegions.ts
 */

const PROVINCE = { id: '52', name: 'NUSA TENGGARA BARAT' };

const CITIES = [
  { id: '5201', name: 'KABUPATEN LOMBOK BARAT' },
  { id: '5202', name: 'KABUPATEN LOMBOK TENGAH' },
  { id: '5203', name: 'KABUPATEN LOMBOK TIMUR' },
  { id: '5208', name: 'KABUPATEN LOMBOK UTARA' },
  { id: '5271', name: 'KOTA MATARAM' },
];

// All NTB districts
const DISTRICTS: { id: string; cityId: string; name: string }[] = [
  // Lombok Barat
  { id: '5201010', cityId: '5201', name: 'SEKOTONG' },
  { id: '5201011', cityId: '5201', name: 'LEMBAR' },
  { id: '5201020', cityId: '5201', name: 'GERUNG' },
  { id: '5201030', cityId: '5201', name: 'LABU API' },
  { id: '5201040', cityId: '5201', name: 'KEDIRI' },
  { id: '5201041', cityId: '5201', name: 'KURIPAN' },
  { id: '5201050', cityId: '5201', name: 'NARMADA' },
  { id: '5201051', cityId: '5201', name: 'LINGSAR' },
  { id: '5201060', cityId: '5201', name: 'GUNUNG SARI' },
  { id: '5201061', cityId: '5201', name: 'BATU LAYAR' },
  // Lombok Tengah
  { id: '5202010', cityId: '5202', name: 'PRAYA BARAT' },
  { id: '5202011', cityId: '5202', name: 'PRAYA BARAT DAYA' },
  { id: '5202020', cityId: '5202', name: 'PUJUT' },
  { id: '5202030', cityId: '5202', name: 'PRAYA TIMUR' },
  { id: '5202040', cityId: '5202', name: 'JANAPRIA' },
  { id: '5202050', cityId: '5202', name: 'KOPANG' },
  { id: '5202060', cityId: '5202', name: 'PRAYA' },
  { id: '5202061', cityId: '5202', name: 'PRAYA TENGAH' },
  { id: '5202070', cityId: '5202', name: 'JONGGAT' },
  { id: '5202080', cityId: '5202', name: 'PRINGGARATA' },
  { id: '5202090', cityId: '5202', name: 'BATUKLIANG' },
  { id: '5202091', cityId: '5202', name: 'BATUKLIANG UTARA' },
  // Lombok Timur
  { id: '5203010', cityId: '5203', name: 'KERUAK' },
  { id: '5203011', cityId: '5203', name: 'JEROWARU' },
  { id: '5203020', cityId: '5203', name: 'SAKRA' },
  { id: '5203021', cityId: '5203', name: 'SAKRA BARAT' },
  { id: '5203022', cityId: '5203', name: 'SAKRA TIMUR' },
  { id: '5203030', cityId: '5203', name: 'TERARA' },
  { id: '5203031', cityId: '5203', name: 'MONTONG GADING' },
  { id: '5203040', cityId: '5203', name: 'SIKUR' },
  { id: '5203050', cityId: '5203', name: 'MASBAGIK' },
  { id: '5203051', cityId: '5203', name: 'PRINGGASELA' },
  { id: '5203060', cityId: '5203', name: 'SUKAMULIA' },
  { id: '5203061', cityId: '5203', name: 'SURALAGA' },
  { id: '5203070', cityId: '5203', name: 'SELONG' },
  { id: '5203071', cityId: '5203', name: 'LABUHAN HAJI' },
  { id: '5203080', cityId: '5203', name: 'PRINGGABAYA' },
  { id: '5203081', cityId: '5203', name: 'SUELA' },
  { id: '5203090', cityId: '5203', name: 'AIKMEL' },
  { id: '5203091', cityId: '5203', name: 'WANASABA' },
  { id: '5203092', cityId: '5203', name: 'SEMBALUN' },
  { id: '5203100', cityId: '5203', name: 'SAMBELIA' },
  // Lombok Utara
  { id: '5208010', cityId: '5208', name: 'PEMENANG' },
  { id: '5208020', cityId: '5208', name: 'TANJUNG' },
  { id: '5208030', cityId: '5208', name: 'GANGGA' },
  { id: '5208040', cityId: '5208', name: 'KAYANGAN' },
  { id: '5208050', cityId: '5208', name: 'BAYAN' },
  // Kota Mataram
  { id: '5271010', cityId: '5271', name: 'AMPENAN' },
  { id: '5271011', cityId: '5271', name: 'SEKARBELA' },
  { id: '5271020', cityId: '5271', name: 'MATARAM' },
  { id: '5271021', cityId: '5271', name: 'SELAPARANG' },
  { id: '5271030', cityId: '5271', name: 'CAKRANEGARA' },
  { id: '5271031', cityId: '5271', name: 'SANDUBAYA' },
];

async function seed() {
  console.log('🌱 Seeding NTB region data (offline)...\n');

  const existing = await prisma.province.count();
  if (existing > 0) {
    console.log(`⚠️  Already have ${existing} provinces. Skipping.`);
    return;
  }

  // Province
  await prisma.province.create({ data: PROVINCE });
  console.log(`✅ Province: ${PROVINCE.name}`);

  // Cities
  await prisma.city.createMany({
    data: CITIES.map((c) => ({ id: c.id, name: c.name, provinceId: '52' })),
  });
  console.log(`✅ ${CITIES.length} cities`);

  // Districts
  await prisma.district.createMany({
    data: DISTRICTS.map((d) => ({ id: d.id, name: d.name, cityId: d.cityId })),
  });
  console.log(`✅ ${DISTRICTS.length} districts`);

  // Villages — fetched on-demand via API proxy, not seeded
  console.log('ℹ️  Villages will be fetched on-demand via API proxy');

  console.log(`\n🎉 Done! ${CITIES.length} kota, ${DISTRICTS.length} kecamatan`);
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
