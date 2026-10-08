// Utility to provide high-quality category default images and fallbacks
export const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  barfi: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  laddu: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
  halwa: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
  mithai: 'https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=400&q=80',
  'dry fruit sweets': 'https://images.unsplash.com/photo-1606914501449-5a96b6ce24ca?w=400&q=80',
  cakes: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
};

export const getCategoryDefaultImage = (category?: string): string => {
  if (!category) return CATEGORY_DEFAULT_IMAGES.mithai;
  const key = category.trim().toLowerCase();
  return CATEGORY_DEFAULT_IMAGES[key] || CATEGORY_DEFAULT_IMAGES.mithai;
};

export const handleImageFallback = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  target.onerror = null;
  const randomSeed = Math.random().toString(36).substring(2, 8);
  target.src = `https://picsum.photos/seed/${randomSeed}/400/400`;
};
