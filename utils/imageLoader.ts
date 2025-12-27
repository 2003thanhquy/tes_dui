// Image loader utility - Professional image management

export interface GalleryImage {
  id: number;
  url: string;
  title: string;
  message: string;
  loaded?: boolean;
}

// Default messages for images
const DEFAULT_MESSAGES = [
  "Mùa đông này ấm áp vì có em bên cạnh ❤️",
  "Nụ cười của em toả sáng hơn cả đèn cây thông ✨",
  "Giáng sinh an lành, tình yêu của anh 🎄",
  "Cùng nhau già đi, cùng nhau đón Noel nhé 🎁",
  "Món quà tuyệt nhất năm nay chính là Em 💝",
  "Em là ánh sáng trong cuộc đời anh 🌟",
  "Mỗi khoảnh khắc bên em đều là món quà 🎀",
  "Anh yêu em nhiều hơn cả những vì sao trên trời ⭐",
  "Giáng sinh này và mọi Giáng sinh sau, anh đều muốn ở bên em 🎄❤️",
  "Em làm cho mùa đông trở nên ấm áp hơn bao giờ hết 🔥",
  "Tình yêu của chúng ta đẹp hơn cả cây thông Noel 🌲",
  "Anh cảm ơn em vì đã đến bên anh trong mùa Giáng sinh này 🙏",
  "Em là điều ước Giáng sinh của anh đã thành hiện thực ✨",
  "Mỗi ngày bên em đều là ngày lễ tình yêu 💕",
  "Anh muốn nắm tay em đi qua mọi mùa Giáng sinh 🎅"
];

const DEFAULT_TITLES = [
  "Kỷ niệm đẹp",
  "Khoảnh khắc yêu thương",
  "Giáng sinh an lành",
  "Lời hứa mãi mãi",
  "Món quà tuyệt nhất",
  "Tình yêu vĩnh cửu",
  "Khoảnh khắc ngọt ngào",
  "Hạnh phúc bên nhau",
  "Kỷ niệm đáng nhớ",
  "Tình yêu bất tận"
];

// Known image files in public folder
const KNOWN_IMAGES = [
  "1.jpg",
  "2.jpg",
  "3.jpg",
  "4.jpg",
  "5.jpg",
  "342139199_6060347000714822_863190457664664639_n.jpg",
  "491899965_18311284108239553_1106183459644652429_n.jpg",
  "495294218_18311284117239553_1150659943456922383_n.jpg",
  "588438956_18339164338239553_8104243110023908414_n.jpg",
  "588579164_18339164353239553_4618628796253501151_n.jpg"
];

/**
 * Load all images from public folder
 * @param maxImages - Maximum number of images to load (0 = all)
 * @param randomize - Whether to randomize the selection
 * @returns Array of GalleryImage objects
 */
export const loadGalleryImages = (
  maxImages: number = 0, // 0 = all images
  randomize: boolean = false
): GalleryImage[] => {
  let images = KNOWN_IMAGES.map((filename, index) => {
    // Extract number from filename for better ordering
    const numberMatch = filename.match(/^(\d+)\.jpg$/);
    const number = numberMatch ? parseInt(numberMatch[1]) : index + 1;
    
    return {
      id: index + 1,
      url: `/${filename}`,
      title: DEFAULT_TITLES[index % DEFAULT_TITLES.length] || `Kỷ niệm ${index + 1}`,
      message: DEFAULT_MESSAGES[index % DEFAULT_MESSAGES.length] || "Một kỷ niệm đẹp ❤️",
      loaded: false
    };
  });

  // Sort by filename number if possible
  images.sort((a, b) => {
    const numA = parseInt(a.url.match(/\/(\d+)\.jpg$/)?.[1] || "999");
    const numB = parseInt(b.url.match(/\/(\d+)\.jpg$/)?.[1] || "999");
    return numA - numB;
  });

  // Randomize if requested
  if (randomize) {
    images = images.sort(() => Math.random() - 0.5);
  }

  // Limit number of images if specified
  if (maxImages > 0 && maxImages < images.length) {
    images = images.slice(0, maxImages);
  }

  return images;
};

/**
 * Preload images for better performance
 * @param images - Array of GalleryImage objects
 * @param onProgress - Callback for progress updates
 * @returns Promise that resolves when all images are loaded
 */
export const preloadImages = (
  images: GalleryImage[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> => {
  return new Promise((resolve) => {
    let loadedCount = 0;
    const total = images.length;

    const loadImage = (image: GalleryImage) => {
      return new Promise<void>((resolveImg) => {
        const img = new Image();
        img.onload = () => {
          image.loaded = true;
          loadedCount++;
          onProgress?.(loadedCount, total);
          resolveImg();
        };
        img.onerror = () => {
          console.warn(`Failed to load image: ${image.url}`);
          loadedCount++;
          onProgress?.(loadedCount, total);
          resolveImg();
        };
        img.src = image.url;
      });
    };

    // Load images with concurrency limit (3 at a time)
    const concurrency = 3;
    let currentIndex = 0;

    const loadNext = () => {
      while (currentIndex < total && currentIndex < loadedCount + concurrency) {
        loadImage(images[currentIndex]).then(() => {
          if (currentIndex < total) {
            currentIndex++;
            loadNext();
          }
          if (loadedCount === total) {
            resolve();
          }
        });
        currentIndex++;
      }
    };

    loadNext();
  });
};

/**
 * Get recommended number of images based on device performance
 * @returns Recommended max images
 */
export const getRecommendedImageCount = (): number => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isLowEnd = navigator.hardwareConcurrency <= 4 || 
                   (navigator.deviceMemory && navigator.deviceMemory <= 4);
  
  if (isMobile || isLowEnd) {
    return 5; // Mobile/low-end: 5 images
  }
  
  return 0; // Desktop: all images (0 = unlimited)
};

