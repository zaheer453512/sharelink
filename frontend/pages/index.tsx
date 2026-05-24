import Head from 'next/head';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorks from '../components/HowItWorks';
import ReviewsSection from '../components/ReviewsSection';
import FAQSection from '../components/FAQSection';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <Head>
        <title>TeraStream — Cloud Video Streaming Platform</title>
        <meta name="description" content="Stream and download TeraBox videos instantly. Fast, HD cloud media streaming platform with 4K support, subtitles, and zero buffering." />
        <meta name="keywords" content="cloud video streaming, online media player, terabox stream, file streaming platform, HD video player" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="TeraStream — Cloud Video Streaming Platform" />
        <meta property="og:description" content="Stream and download TeraBox videos instantly. Fast, HD cloud media streaming." />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <div className="app-wrapper">
        <Navbar />
        <main>
          <HeroSection />
          <FeaturesSection />
          <HowItWorks />
          <ReviewsSection />
          <FAQSection />
        </main>
        <Footer />
      </div>
    </>
  );
}
