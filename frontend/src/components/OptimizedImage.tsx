import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(priority);
  const [imageSrc, setImageSrc] = useState<string>(priority ? src : '');

  useEffect(() => {
    if (priority) return;

    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
      onError?.();
    };
  }, [src, priority, onError]);

  const containerStyle: React.CSSProperties = {};
  if (width && height) {
    containerStyle.aspectRatio = `${width}/${height}`;
  }

  return (
    <div style={containerStyle} className={`overflow-hidden bg-muted ${className}`}>
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
