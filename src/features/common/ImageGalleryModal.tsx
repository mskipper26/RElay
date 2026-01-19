import React, { useState, useEffect } from 'react';
import { getRecentImages, saveImageToLibrary } from '../../services/letterService';

interface ImageGalleryModalProps {
    onClose: () => void;
    onSelect: (image: any) => void;
}

export const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ onClose, onSelect }) => {
    const [expandedImage, setExpandedImage] = useState<string | null>(null);
    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        setLoading(true);
        try {
            const recent = await getRecentImages();
            setImages(recent);
        } catch (err) {
            console.error('Failed to load images', err);
        } finally {
            setLoading(false);
        }
    };

    // ... handleFileUpload ...

    // In render loop: onClick={() => onSelect(img)}

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        setUploading(true);
        try {
            const result = await saveImageToLibrary(file);
            // Prepend new image and select it automatically? Or just show it?
            // Let's just refresh the list or add it manually
            setImages(prev => [{ id: result.id, url: result.url, file: result.file, createdAt: new Date() }, ...prev]);
        } catch (err) {
            console.error('Upload failed', err);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-parchment w-full max-w-3xl h-[80vh] flex flex-col border border-ink shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <header className="flex justify-between items-center p-4 border-b border-ink/20">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-ink">Image Library</h2>
                    <button onClick={onClose} className="text-ink hover:text-klein text-xl">&times;</button>
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin h-8 w-8 border-4 border-ink border-t-transparent rounded-full"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {/* Upload Card */}
                            <label className="aspect-square border-2 border-dashed border-ink/30 flex flex-col items-center justify-center cursor-pointer hover:border-klein hover:bg-klein/5 transition-colors group">
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                                {uploading ? (
                                    <div className="animate-spin h-6 w-6 border-2 border-ink border-t-transparent rounded-full"></div>
                                ) : (
                                    <>
                                        <span className="text-4xl text-ink/30 group-hover:text-klein mb-2">+</span>
                                        <span className="text-xs uppercase tracking-widest text-ink/50 group-hover:text-klein">Upload New</span>
                                    </>
                                )}
                            </label>

                            {images.map(img => (
                                <div
                                    key={img.id}
                                    className="aspect-square border border-ink/10 relative group cursor-pointer overflow-hidden"
                                >
                                    <img src={img.url} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 grayscale group-hover:grayscale-0" onClick={() => onSelect(img)} />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex flex-col items-center justify-center space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onSelect(img)}
                                            className="bg-parchment px-4 py-1.5 text-xs uppercase tracking-widest shadow-sm transform translate-y-4 group-hover:translate-y-0 transition-all hover:bg-klein hover:text-white"
                                        >
                                            Select
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedImage(img.url);
                                            }}
                                            className="bg-ink text-parchment px-4 py-1.5 text-xs uppercase tracking-widest shadow-sm transform translate-y-4 group-hover:translate-y-0 transition-all delay-75 hover:bg-klein"
                                        >
                                            Expand
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {images.length === 0 && !loading && (
                                <div className="col-span-full text-center py-10 opacity-50 font-serif italic">
                                    No past images found. Upload one to get started.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox Overlay */}
            {expandedImage && (
                <div
                    className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-8 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setExpandedImage(null)}
                >
                    <img
                        src={expandedImage}
                        className="max-w-full max-h-full object-contain shadow-2xl"
                    />
                    <button
                        onClick={() => setExpandedImage(null)}
                        className="absolute top-6 right-6 text-white text-4xl hover:text-klein transition-colors"
                    >
                        &times;
                    </button>
                    <div className="absolute bottom-6 text-white/50 text-xs font-mono uppercase tracking-widest">
                        Click anywhere to close
                    </div>
                </div>
            )}
        </div>
    );
};
