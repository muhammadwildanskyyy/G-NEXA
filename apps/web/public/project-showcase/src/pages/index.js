import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import {
  Workflow,
  Zap,
  ShieldCheck,
  Layers,
  Network,
  Monitor,
  Globe,
  Cpu,
  Database,
  Code2,
  MessagesSquare,
  ArrowRight,
  ArrowLeftRight
} from 'lucide-react';

import styles from './index.module.css';

function ScrollReveal({ children, className }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    const current = domRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={clsx(styles.reveal, isVisible && styles.revealVisible, className)}
    >
      {children}
    </div>
  );
}

function useParallax(amount = 20) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * amount;
      const y = (e.clientY / window.innerHeight - 0.5) * amount;
      setOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [amount]);

  return offset;
}

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  const parallax = useParallax(30);

  return (
    <header
      className={styles.heroBanner}
      style={{
        backgroundPosition: `${50 + parallax.x}% ${50 + parallax.y}%`
      }}
    >
      <div className="container">
        <ScrollReveal>
          <h1 className={styles.heroTitle}>G-NEXA PROJECT</h1>
          <div className={styles.minimalAcronym}>
            <div className={styles.acronymBlock}>
              <span className={styles.initial}>G</span>
              <span className={styles.term}>Golang</span>
            </div>
            <div className={styles.acronymBlock}>
              <span className={styles.initial}>N</span>
              <span className={styles.term}>NestJS</span>
            </div>
            <div className={styles.acronymBlock}>
              <span className={styles.initial}>E</span>
              <span className={styles.term}>ExpressJS</span>
            </div>
            <div className={styles.acronymBlock}>
              <span className={styles.initial}>X</span>
              <span className={styles.term}>NextJS/NuxtJS</span>
            </div>
            <div className={styles.acronymBlock}>
              <span className={styles.initial}>A</span>
              <span className={styles.term}>API Gateway</span>
            </div>
          </div>
          <div className={styles.buttons}>
            <Link
              className="button button--primary button--lg"
              to="/docs/overview/vision">
              Documentation
            </Link>
            <Link
              className="button button--secondary button--lg"
              onClick={(e) => {
                e.preventDefault();
                alert('G-NEXA App is currently in a private engineering phase and is not available for public access yet.');
              }}
              to="/">
              Go to APP (Coming Soon)
            </Link>
            <Link
              className="button button--secondary button--lg"
              onClick={(e) => {
                e.preventDefault();
                alert('G-NEXA source code is currently in a private repository for security audit and internal review.');
              }}
              to="/">
              GitHub (Coming Soon)
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </header>
  );
}

function SectionHeader({ title, subtitle, centered = true }) {
  return (
    <div className={clsx('margin-bottom--lg', centered && 'text--center')}>
      <Heading as="h2">{title}</Heading>
      {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
    </div>
  );
}

function TheAbstract() {
  return (
    <section className={styles.abstractSection}>
      <div className="container">
        <ScrollReveal>
          <SectionHeader
            subtitle="PROJECT DEFINITION"
            title="Apa itu G-NEXA?"
          />
          <div className={styles.abstractContent}>
            <p>
              <strong>G-NEXA</strong> G-NEXA bukanlah sebuah platform e-commerce komersial, melainkan sebuah proyek eksperimen teknik dan portofolio yang dirancang khusus untuk mengimplementasikan arsitektur microservices skala enterprise. Proyek ini sengaja dibangun menggunakan beberapa bahasa pemrograman dan ekosistem yang berbeda—seperti Golang, NestJS, dan Express.js untuk sistem backend, serta Next/Nuxt untuk frontend—guna mendemonstrasikan bagaimana teknologi yang beragam dapat disatukan secara harmonis. Melalui eksperimen ini, G-NEXA memecah kerumitan satu aplikasi raksasa menjadi layanan-layanan kecil independen yang saling melengkapi layaknya mesin industri di dunia nyata.
            </p>
            <p>
              Tujuan utama dari proyek eksperimen ini adalah untuk membuktikan kemampuan sistem dalam menyelesaikan masalah-masalah kompleks di balik layar, bukan sekadar menampilkan etalase belanja. Dengan merancang pola komunikasi yang rapi antar-layanan yang berbeda bahasa tersebut (baik secara langsung maupun menggunakan sistem antrean pesan), G-NEXA difokuskan untuk menjawab tiga tantangan besar: mengurai kerumitan aliran data lintas platform, menjaga keamanan dan keutuhan transaksi (terutama saat pembeli berbelanja dari banyak toko sekaligus), serta memastikan arsitekturnya tetap tangguh dan siap diskalakan kapan saja.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function Feature({ title, description, icon: Icon, colSize = '4' }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    cardRef.current.style.setProperty('--mouse-x', `${x}%`);
    cardRef.current.style.setProperty('--mouse-y', `${y}%`);
  };

  return (
    <div className={clsx(`col col--${colSize}`, 'margin-bottom--lg')}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className={clsx('card', styles.featureCard)}
      >
        <div className="card__header">
          <Icon className={styles.featureIcon} size={32} />
          <Heading as="h3">{title}</Heading>
        </div>
        <div className="card__body">
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}

const FeatureList = [
  {
    title: 'Konsistensi Data Lintas Layanan (Distributed Data Consistency & Saga Pattern)',
    icon: Workflow,
    description: (
      <>
        Dalam arsitektur microservices, kita kehilangan kemewahan single database transaction (ACID) yang mengikat seluruh domain. Tantangan terbesarnya adalah menjaga integritas data saat proses checkout melibatkan banyak layanan independen (Order di NestJS, Wallet di Golang). GNEXA menyelesaikannya dengan mengimplementasikan Saga Pattern (Choreography) via Apache Kafka. Jika terjadi kegagalan sistem di tengah jalan atau batas waktu pembayaran habis (24 jam), sistem tidak akan crash, melainkan memicu event kompensasi (compensating transactions) untuk melakukan rollback stok inventaris secara asinkron tanpa memblokir (non-blocking) proses lain.
      </>
    ),
  },
  {
    title: 'Mitigasi Race Condition pada Mutasi Finansial (Concurrency Control)',
    icon: Zap,
    description: (
      <>
        Fitur dompet digital sangat rentan terhadap anomali konkurensi seperti Double-Spending, terutama jika pengguna melakukan request secara simultan dalam fraksi milidetik. Untuk menjaga atomisitas saldo, Finance Service (Golang) menerapkan mekanisme Pessimistic Locking (SELECT ... FOR UPDATE) di level database PostgreSQL. Mekanisme row-level lock ini secara paksa mengantrekan thread yang masuk bersamaan, menjamin kalkulasi mutasi saldo berjalan absolut dan menihilkan kemungkinan terjadinya negative balance.
      </>
    ),
  },
  {
    title: 'Resiliensi Integrasi Sistem Eksternal (Webhook Idempotency & Fault Tolerance)',
    icon: ShieldCheck,
    description: (
      <>
        Berkomunikasi dengan Payment Gateway pihak ketiga (seperti Xendit) membawa risiko network retries yang berpotensi menghasilkan duplikasi payload webhook. Untuk membangun sistem yang toleran terhadap kegagalan jaringan (fault-tolerant), GNEXA merancang logika Idempotency pada usecase layer. Setiap incoming payload diverifikasi terhadap state machine transaksi di database; jika state sudah berstatus terminal (SUCCEEDED / FAILED), webhook susulan akan dibuang secara aman (graceful discard). Ini mencegah injeksi saldo ganda pada dompet pengguna.
      </>
    ),
  },
  {
    title: 'Agregasi Pembayaran Multi-Tenant (Parent-Child Transaction Mapping)',
    icon: Layers,
    description: (
      <>
        Sebagai platform multi-seller, satu sesi keranjang belanja dapat menghasilkan banyak entitas pesanan dari toko yang berbeda. Melakukan HTTP request ke Payment Gateway untuk setiap pesanan akan menyebabkan overhead biaya admin dan degradasi UX. GNEXA memecahkan masalah ini dengan teknik Order Grouping di NestJS. Sistem secara dinamis memetakan banyak entitas OrderID (Child) ke dalam satu wrapper InvoiceID (Parent). Finance Service kemudian bertindak murni sebagai pemroses Grand Total, menghasilkan satu nomor Virtual Account (VA) untuk efisiensi transaksi tingkat tinggi.
      </>
    ),
  },
  {
    title: 'Interoperabilitas Komunikasi Polyglot (Cross-Service Orchestration)',
    icon: Network,
    description: (
      <>
        Sebagai eksperimen arsitektur polyglot, GNEXA menyatukan ekosistem yang sepenuhnya berbeda (Golang, TypeScript/NestJS, dan JavaScript/Express). Tantangannya adalah menstandardisasi kontrak data (API Contracts) dan skema event agar tidak terjadi mismatch tipe data. Orkestrasi ini diselesaikan dengan menempatkan Kong API Gateway sebagai single entry point yang mengatur routing REST API, sementara Apache Kafka beroperasi sebagai Message Broker yang menjamin pengiriman pesan asinkron (guaranteed delivery) menggunakan format payload JSON yang disepakati secara ketat antar-layanan.
      </>
    ),
  },
];

function TechStackArsenal() {
  const tech = [
    { name: 'Golang', slug: 'go' },
    { name: 'TypeScript', slug: 'typescript' },
    { name: 'Express.js', slug: 'express' },
    { name: 'NestJS', slug: 'nestjs' },
    { name: 'Gin Gonic', slug: 'gin' },
    { name: 'Next.js', slug: 'nextdotjs' },
    { name: 'Nuxt.js', slug: 'nuxt' },
    { name: 'React.JS', slug: 'react' },
    { name: 'Vue.js', slug: 'vuedotjs' },
    { name: 'Apache Kafka', slug: 'apachekafka' },
    { name: 'Xendit', slug: 'xendit' },
    { name: 'Prisma', slug: 'prisma' },
    { name: 'PostgreSQL', slug: 'postgresql' },
    { name: 'MongoDB', slug: 'mongodb' },
    { name: 'Redis', slug: 'redis' },
    { name: 'Kong API Gateway', slug: 'kong' },
    { name: 'Cloudinary', slug: 'cloudinary' },
    { name: 'Docker', slug: 'docker' },
    { name: 'Git', slug: 'git' },
    { name: 'jira', slug: 'jira' },
    { name: 'Taskfile', slug: 'task' },
    { name: 'JavaScript', slug: 'javascript' },
    { name: 'Node.js', slug: 'nodedotjs' },
  ];

  // Logic to repeat tech list for seamless infinite loop
  const duplicatedTech = [...tech, ...tech];

  const renderTrackContent = (isColor = false) => (
    <div className={styles.marqueeTrack}>
      {duplicatedTech.map((t, idx) => (
        <div key={idx} className={styles.techLogoWrapper}>
          <img
            src={isColor
              ? `https://cdn.simpleicons.org/${t.slug}`
              : `https://cdn.simpleicons.org/${t.slug}/gray`}
            alt={t.name}
            className={clsx(styles.techLogo, !isColor && styles.techLogoGrayscale)}
            loading="lazy"
          />
          <span className={styles.techName}>{t.name}</span>
        </div>
      ))}
    </div>
  );

  return (
    <section className={styles.techSection}>
      <ScrollReveal>
        <div className="container text--center margin-bottom--xl">
          <SectionHeader title="The Tech Stack" subtitle="Core Tech Stack & Tools" />
        </div>
        <div className={styles.marqueeContainer}>
          {/* Background Layer: Grayscale */}
          {renderTrackContent(false)}

          {/* Foreground Layer: Original Colors (Controlled by CSS mask in the center) */}
          <div className={styles.marqueeColorLayer}>
            {renderTrackContent(true)}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

function MicroserviceNode({ name, tech, db }) {
  return (
    <div className={styles.microserviceBox}>
      <div className={styles.serviceInfo}>
        <div className={styles.serviceName}>{name}</div>
        <div className={styles.serviceTech}>{tech}</div>
      </div>
      <div className={styles.internalGrid}>
        <div className={styles.internalNode}>
          <Code2 size={16} color="var(--gnexa-teal)" />
          <span>API</span>
        </div>
        <div className={styles.internalNode}>
          <Cpu size={16} color="var(--gnexa-teal)" />
          <span>Logic</span>
        </div>
        <div className={styles.internalNode}>
          <Database size={16} color="var(--gnexa-teal)" />
          <span>{db}</span>
        </div>
      </div>

    </div>
  );
}

function VisualHook() {
  return (
    <section className={styles.visualSection}>
      <div className="container">
        <ScrollReveal>
          <SectionHeader title="Architecture Sneak Peek" subtitle="Enterprise Polyglot Ecosystem" />
          <div className={styles.visualContainer}>
              <div className={styles.diagramMockup}>
                {/* Column 1: Clients */}
                <ScrollReveal className={styles.diagramColumn}>
                  <div className={styles.nodeLarge}>
                    <Monitor className={styles.nodeIcon} size={32} />
                    <span className={styles.nodeLabel}>Shop Web App</span>
                    <span className={styles.nodeSub}>Next.js / Nuxt.js</span>
                  </div>
                </ScrollReveal>

                <div className={styles.connector}>→</div>

                {/* Column 2: Gateway */}
                <ScrollReveal className={styles.diagramColumn}>
                  <div className={styles.nodeLarge}>
                    <Globe className={styles.nodeIcon} size={32} />
                    <span className={styles.nodeLabel}>API Gateway</span>
                    <span className={styles.nodeSub}>Kong / Nginx</span>
                  </div>
                </ScrollReveal>

                <div className={styles.connector}>→</div>

                {/* Column 3: Microservices */}
                <ScrollReveal className={styles.serviceColumn}>
                  <MicroserviceNode name="Finance Service" tech="Go + Gin" db="Postgres" />
                  <MicroserviceNode name="Order Service" tech="NestJS" db="Postgres" />
                  <MicroserviceNode name="Product Service" tech="Go + Gin" db="MongoDB" />
                  <MicroserviceNode name="User Service" tech="Express.js" db="Postgres" />
                  <MicroserviceNode name="Media Service" tech="Go + Fiber" db="Postgres" />
                </ScrollReveal>

                <div className={styles.connector}>
                  <ArrowLeftRight size={24} />
                </div>

                {/* Column 4: Message Broker */}
                <ScrollReveal className={styles.diagramColumn}>
                  <div className={styles.brokerNode}>
                    <MessagesSquare size={32} />
                    <span className={styles.nodeLabel}>Kafka</span>
                    <span className={styles.nodeSub}>Event Broker</span>
                  </div>
                </ScrollReveal>
              </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}



function ShowcaseSection() {
  const items = [
    {
      title: 'Global Storefront',
      image: 'showcase-storefront.png',
      size: 'large'
    },
    {
      title: 'Seller Dashboard',
      image: 'showcase-dashboard.png',
      size: 'medium'
    },
    {
      title: 'Product Intelligence',
      image: 'showcase-product.png',
      size: 'small'
    },
    {
      title: 'Seamless Checkout',
      image: 'showcase-checkout.png',
      size: 'medium'
    }
  ];

  return (
    <section className={styles.showcaseSection}>
      <div className="container">
        <ScrollReveal>
          <div className="text--center margin-bottom--xl">
            <h2 className={styles.showcaseTitle}>Built with GNEXA Architecture</h2>
            <p className={styles.showcaseSubtitle}>
              Experience the power of a highly resilient, multi-language distributed system. (gambar ini hanya contoh hasil dari ai generate)
            </p>
          </div>
          
          <div className={styles.showcaseGrid}>
            {items.map((item, idx) => (
              <div 
                key={idx} 
                className={clsx(styles.showcaseItem, styles[`size-${item.size}`])}
              >
                <div className={styles.showcaseImageWrapper}>
                  <img 
                    src={`/img/${item.image}`} 
                    alt={item.title} 
                    className={styles.showcaseImage}
                  />
                  <div className={styles.showcaseOverlay}>
                    <span className={styles.showcaseItemTitle}>{item.title}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text--center margin-top--xl">
            <p className={styles.showcaseFooterText}>
              Designed for <strong>scalability</strong>, <strong>reliability</strong> and <strong>developer experience</strong>.
            </p>
            <Link
              className="button button--primary button--lg"
              onClick={(e) => {
                e.preventDefault();
                alert('G-NEXA App is currently in a private engineering phase.');
              }}
              to="/">
              Launch Experience Preview
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Welcome to ${siteConfig.title}`}
      description="GNEXA Engineering Journal - Enterprise Multi-seller E-commerce Architecture">
      <HomepageHeader />
      <main>
        <TheAbstract />
        <VisualHook />
        <section className={styles.features}>
          <div className="container">
            <ScrollReveal>
              <SectionHeader title="The Hard Things" subtitle="Technical Deep Dives" />
              {/* Row 1: 3 Features */}
              <div className="row">
                {FeatureList.slice(0, 3).map((props, idx) => (
                  <Feature key={idx} {...props} colSize="4" />
                ))}
              </div>
              {/* Row 2: 2 Features (Proporsional 6-6) */}
              <div className="row">
                <div className="col col--1 hide-mobile" />
                {FeatureList.slice(3).map((props, idx) => (
                  <Feature key={idx + 3} {...props} colSize="5" />
                ))}
                <div className="col col--1 hide-mobile" />
              </div>
            </ScrollReveal>
          </div>
        </section>

        <ShowcaseSection />

        <TechStackArsenal />


      </main>
    </Layout>
  );
}
