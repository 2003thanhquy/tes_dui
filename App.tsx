import React from 'react';
import TetPage from './components/TetPage';
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
  return <TetPage galleryImages={GALLERY_IMAGES} />;
};

export default App;