import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TetPage from './components/TetPage';
import SimpleNewYearPage from './components/SimpleNewYearPage';
import { loadGalleryImages, getRecommendedImageCount, GalleryImage } from './utils/imageLoader';

// --- GALLERY IMAGES ---
// Load images with performance optimization
const MAX_IMAGES_TO_DISPLAY = getRecommendedImageCount(); // Auto-detect based on device
const GALLERY_IMAGES: GalleryImage[] = loadGalleryImages(MAX_IMAGES_TO_DISPLAY, false);

/**
 * App - Tết 2026 "Gửi Yêu Thương"
 * 
 * Simplified version focused only on Tet page
 * for better performance and user experience.
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TetPage galleryImages={GALLERY_IMAGES} />} />
        <Route path="/page" element={<SimpleNewYearPage />} />
        <Route path="/page/:name" element={<SimpleNewYearPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;