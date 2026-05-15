import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

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
              <li><Link href="/category/kesehatan">Kesehatan</Link></li>
              <li><Link href="/category/gaya-hidup">Gaya Hidup</Link></li>
              <li><Link href="/search">Pencarian</Link></li>
            </ul>
          </div>


          <div className={styles.linksColumn}>
            <h3 className={styles.columnTitle}>Hubungi Kami</h3>
            <div className={styles.contactItem}>
              <span className="material-symbols-outlined">mail</span>
              <span>hello@xinbie.id</span>
            </div>
            <div className={styles.contactItem}>
              <span className="material-symbols-outlined">call</span>
              <span>+62 859-6146-2361</span>
            </div>
            <div className={styles.contactItem}>
              <span className="material-symbols-outlined">location_on</span>
              <span>Bogor, Indonesia</span>
            </div>
          </div>
        </div>

        <div className={styles.bottomSection}>
          <p className={styles.copyright}>
            © {currentYear} XINBIE. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
