#!/usr/bin/env node

/**
 * Image Optimization Script
 * 
 * Resizes and compresses all JPG images in public/ folder
 * 
 * Requirements:
 *   npm install sharp
 * 
 * Usage:
 *   node scripts/optimize-images.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if sharp is installed
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  console.error('❌ Error: sharp is not installed!');
  console.log('📦 Please install it first:');
  console.log('   npm install sharp');
  process.exit(1);
}

const publicDir = path.join(__dirname, '../public');
const backupDir = path.join(__dirname, '../public-backup');

// Create backup directory
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('📁 Created backup directory:', backupDir);
}

// Get all JPG files
const images = fs.readdirSync(publicDir).filter(f => 
  f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg')
);

if (images.length === 0) {
  console.log('⚠️  No JPG images found in public/ folder');
  process.exit(0);
}

console.log(`📸 Found ${images.length} images to optimize\n`);

// Optimization settings
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const QUALITY = 85; // 80-90 is good balance

let processed = 0;
let totalSaved = 0;

async function optimizeImage(file) {
  const inputPath = path.join(publicDir, file);
  const backupPath = path.join(backupDir, file);
  const tempPath = path.join(publicDir, file + '.tmp');
  
  try {
    // Get original size
    const originalStats = fs.statSync(inputPath);
    const originalSize = originalStats.size;
    
    // Backup original (only if not already backed up)
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(inputPath, backupPath);
    }
    
    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    const needsResize = metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT;
    
    // Optimize to temp file first
    let pipeline = sharp(inputPath);
    
    if (needsResize) {
      pipeline = pipeline.resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    await pipeline
      .jpeg({ 
        quality: QUALITY,
        mozjpeg: true // Better compression
      })
      .toFile(tempPath);
    
    // Replace original with optimized version
    fs.renameSync(tempPath, inputPath);
    
    // Get new size
    const newStats = fs.statSync(inputPath);
    const newSize = newStats.size;
    const saved = originalSize - newSize;
    const savedPercent = ((saved / originalSize) * 100).toFixed(1);
    
    totalSaved += saved;
    processed++;
    
    console.log(`✅ [${processed}/${images.length}] ${file}`);
    console.log(`   ${(originalSize / 1024).toFixed(1)}KB → ${(newSize / 1024).toFixed(1)}KB (saved ${savedPercent}%)`);
    
    if (needsResize) {
      console.log(`   📐 Resized: ${metadata.width}x${metadata.height} → ${MAX_WIDTH}x${MAX_HEIGHT} (max)`);
    }
    console.log('');
    
  } catch (error) {
    console.error(`❌ Error optimizing ${file}:`, error.message);
  }
}

// Process all images
async function main() {
  console.log('🚀 Starting image optimization...\n');
  console.log(`Settings:`);
  console.log(`  Max dimensions: ${MAX_WIDTH}x${MAX_HEIGHT}`);
  console.log(`  Quality: ${QUALITY}%\n`);
  
  for (const image of images) {
    await optimizeImage(image);
  }
  
  console.log('✨ Optimization complete!\n');
  console.log(`📊 Summary:`);
  console.log(`  Processed: ${processed} images`);
  console.log(`  Total saved: ${(totalSaved / 1024).toFixed(1)}KB (${((totalSaved / (totalSaved + (fs.statSync(path.join(publicDir, images[0])).size * images.length))) * 100).toFixed(1)}%)`);
  console.log(`  Backup location: ${backupDir}\n`);
  console.log('💡 Original images are backed up in public-backup/');
}

main().catch(console.error);

