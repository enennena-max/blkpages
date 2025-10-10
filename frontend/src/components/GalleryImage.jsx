import { useState } from 'react';

export default function GalleryImage({ photo, isHero = false }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    if (!photo || !photo.variants) {
        return null;
    }

    const variants = photo.variants;
    
    // Generate srcset for different formats and sizes
    const generateSrcSet = (format) => {
        const sizes = ['small', 'medium', 'large'];
        return sizes
            .map(size => {
                const url = variants[size]?.[format];
                const width = size === 'small' ? 480 : size === 'medium' ? 960 : 1600;
                return url ? `${url} ${width}w` : null;
            })
            .filter(Boolean)
            .join(', ');
    };

    const srcSetAvif = generateSrcSet('avif');
    const srcSetWebp = generateSrcSet('webp');
    const srcSetJpg = generateSrcSet('jpg');

    // Fallback image
    const fallbackSrc = variants.medium?.jpg || variants.small?.jpg || photo.url;

    const handleLoad = () => {
        setLoaded(true);
    };

    const handleError = () => {
        setError(true);
    };

    if (error) {
        return (
            <div className="gallery-image error">
                <div className="error-placeholder">
                    <span>📷</span>
                    <p>Image failed to load</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`gallery-image ${isHero ? 'hero-image' : ''}`}>
            {/* LQIP Background */}
            {photo.lqip?.dataUri && !loaded && (
                <div 
                    className="lqip-background"
                    style={{ 
                        backgroundImage: `url(${photo.lqip.dataUri})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />
            )}
            
            {/* Responsive Image */}
            <picture className="responsive-image">
                {srcSetAvif && (
                    <source 
                        type="image/avif" 
                        srcSet={srcSetAvif}
                        sizes={isHero ? 
                            "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" :
                            "(max-width: 600px) 90vw, (max-width: 1200px) 45vw, 30vw"
                        }
                    />
                )}
                {srcSetWebp && (
                    <source 
                        type="image/webp" 
                        srcSet={srcSetWebp}
                        sizes={isHero ? 
                            "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" :
                            "(max-width: 600px) 90vw, (max-width: 1200px) 45vw, 30vw"
                        }
                    />
                )}
                <img
                    src={fallbackSrc}
                    srcSet={srcSetJpg}
                    sizes={isHero ? 
                        "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" :
                        "(max-width: 600px) 90vw, (max-width: 1200px) 45vw, 30vw"
                    }
                    alt={photo.caption || photo.filename || 'Business photo'}
                    loading="lazy"
                    onLoad={handleLoad}
                    onError={handleError}
                    className={`responsive-img ${loaded ? 'loaded' : ''}`}
                />
            </picture>
            
            {/* Caption Overlay */}
            {photo.caption && (
                <div className="image-caption">
                    <p>{photo.caption}</p>
                </div>
            )}
            
            {/* Hero Badge */}
            {isHero && (
                <div className="hero-badge">
                    <span>⭐ Featured</span>
                </div>
            )}
        </div>
    );
}
