import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

async function fetchCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/categories`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching categories in Footer:', error);
    return [];
  }
}

const Footer = async () => {
  const currentYear = new Date().getFullYear();
  const categories = await fetchCategories();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topSection}>
          <div className={styles.brandColumn}>
            <div className={styles.logo}>
              <img src="/logo.svg" alt="XINBIE" className={styles.logoImage} />
            </div>
            <p className={styles.description}>
              Brand alat terapi dan kesehatan yang berkomitmen membantu masyarakat Indonesia hidup sehat dengan harga terjangkau sejak 2020.
            </p>
          </div>

          <div className={styles.linksColumn}>
            <h3 className={styles.columnTitle}>Kategori</h3>
            <ul className={styles.linkList}>
              <li><Link href="/products">Semua Produk</Link></li>
              {categories.map((cat: any) => (
                <li key={cat.id}>
                  <Link href={`/category/${cat.slug}`}>{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.contactColumn}>
            <h3 className={styles.columnTitle}>Hubungi Kami</h3>
            <div className={styles.contactList}>
              <div className={styles.contactItem}>
                <span className={`material-symbols-outlined ${styles.contactIcon}`}>mail</span>
                <div className={styles.contactText}>
                  <span className={styles.contactLabel}>Email</span>
                  <span className={styles.contactValue}>hello@xinbie.id</span>
                </div>
              </div>
              <div className={styles.contactItem}>
                <span className={`material-symbols-outlined ${styles.contactIcon}`}>call</span>
                <div className={styles.contactText}>
                  <span className={styles.contactLabel}>Telepon</span>
                  <span className={styles.contactValue}>+62 877-9420-4259</span>
                </div>
              </div>
              <div className={styles.contactItem}>
                <span className={`material-symbols-outlined ${styles.contactIcon}`}>location_on</span>
                <div className={styles.contactText}>
                  <span className={styles.contactLabel}>Lokasi</span>
                  <span className={styles.contactValue}>Depok, Indonesia</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottomSection}>
          <div className={styles.bottomContainer}>
            <p className={styles.copyright}>
              © {currentYear} XINBIE. Seluruh hak cipta dilindungi.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
