import { useState, useEffect } from 'react';
import './PhotoUploadManager.css';

function getBusinessIdFromURL() {
    const u = new URL(window.location.href);
    return u.searchParams.get('businessId') || 'royalHairStudio';
}

export default function PhotoUploadManager() {
    const businessId = getBusinessIdFromURL();
    const [photos, setPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);

    const fetchPhotos = async () => {
        try {
            const res = await fetch(`/api/photos?businessId=${businessId}`);
            const json = await res.json();
            setPhotos(json);
        } catch (error) {
            console.error('Error fetching photos:', error);
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, [businessId]);

    const handleFiles = async (files) => {
        const fileArray = Array.from(files);
        setSelectedFiles(fileArray);
        
        const formData = new FormData();
        formData.append('businessId', businessId);
        
        fileArray.forEach(file => {
            formData.append('photos', file);
        });

        setUploading(true);
        try {
            const res = await fetch('/api/photos/upload', { 
                method: 'POST', 
                body: formData 
            });
            const result = await res.json();
            
            if (result.success) {
                await fetchPhotos();
                setSelectedFiles([]);
            } else {
                alert('Upload failed: ' + result.error);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleFileInput = (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    };

    const handleDelete = async (photoId) => {
        if (!confirm('Are you sure you want to delete this photo?')) return;
        
        try {
            const res = await fetch(`/api/photos/${photoId}`, { 
                method: 'DELETE' 
            });
            
            if (res.ok) {
                await fetchPhotos();
            } else {
                alert('Failed to delete photo');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete photo');
        }
    };

    const handleReorder = async (newOrderArray) => {
        try {
            const res = await fetch('/api/photos/reorder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates: newOrderArray })
            });
            
            if (res.ok) {
                await fetchPhotos();
            }
        } catch (error) {
            console.error('Reorder error:', error);
        }
    };

    const movePhoto = (fromIndex, toIndex) => {
        const newPhotos = [...photos];
        const [movedPhoto] = newPhotos.splice(fromIndex, 1);
        newPhotos.splice(toIndex, 0, movedPhoto);
        
        // Update order values
        const reorderUpdates = newPhotos.map((photo, index) => ({
            photoId: photo._id,
            order: index
        }));
        
        setPhotos(newPhotos);
        handleReorder(reorderUpdates);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="photo-upload-manager">
            <h2>Photo Gallery Manager</h2>
            <p className="subtitle">Upload and manage your business photos</p>

            {/* Upload Area */}
            <div 
                className={`drop-area ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {uploading ? (
                    <div className="upload-progress">
                        <div className="spinner"></div>
                        <p>Uploading photos...</p>
                    </div>
                ) : (
                    <div className="upload-content">
                        <div className="upload-icon">📸</div>
                        <h3>Drop photos here or click to browse</h3>
                        <p>Supports JPG, PNG, WebP, AVIF (max 8MB each)</p>
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*"
                            onChange={handleFileInput}
                            className="file-input"
                        />
                        <button className="browse-btn">Choose Files</button>
                    </div>
                )}
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && !uploading && (
                <div className="selected-files">
                    <h4>Selected Files ({selectedFiles.length})</h4>
                    <div className="file-list">
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="file-item">
                                <span className="file-name">{file.name}</span>
                                <span className="file-size">{formatFileSize(file.size)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Photo Gallery */}
            <div className="photo-gallery">
                <div className="gallery-header">
                    <h3>Your Photos ({photos.length})</h3>
                    <p className="gallery-subtitle">
                        Drag to reorder • First 3 photos appear as hero images
                    </p>
                </div>

                {photos.length === 0 ? (
                    <div className="empty-gallery">
                        <div className="empty-icon">🖼️</div>
                        <p>No photos uploaded yet</p>
                        <p className="empty-subtitle">Upload your first photos to get started</p>
                    </div>
                ) : (
                    <div className="thumbnails">
                        {photos.map((photo, index) => (
                            <div 
                                key={photo._id} 
                                className={`thumb ${index < 3 ? 'hero-image' : ''}`}
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData('text/plain', index)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                    const toIndex = index;
                                    if (fromIndex !== toIndex) {
                                        movePhoto(fromIndex, toIndex);
                                    }
                                }}
                            >
                                <div className="thumb-image">
                                    <img 
                                        src={photo.variants?.thumb?.webp || photo.url} 
                                        alt={photo.caption || photo.filename}
                                        loading="lazy"
                                    />
                                    {photo.lqip?.dataUri && (
                                        <div 
                                            className="lqip-placeholder"
                                            style={{ backgroundImage: `url(${photo.lqip.dataUri})` }}
                                        />
                                    )}
                                </div>
                                
                                <div className="thumb-overlay">
                                    <div className="thumb-actions">
                                        <button 
                                            className="delete-btn"
                                            onClick={() => handleDelete(photo._id)}
                                            title="Delete photo"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    
                                    <div className="thumb-info">
                                        <div className="photo-order">
                                            {index < 3 && <span className="hero-badge">Hero</span>}
                                            <span className="order-number">{index + 1}</span>
                                        </div>
                                        {photo.caption && (
                                            <div className="photo-caption">{photo.caption}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Gallery Stats */}
            {photos.length > 0 && (
                <div className="gallery-stats">
                    <div className="stat-item">
                        <span className="stat-label">Total Photos:</span>
                        <span className="stat-value">{photos.length}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Hero Images:</span>
                        <span className="stat-value">{Math.min(photos.length, 3)}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Storage Used:</span>
                        <span className="stat-value">
                            {formatFileSize(photos.reduce((total, photo) => total + (photo.original?.size || 0), 0))}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
