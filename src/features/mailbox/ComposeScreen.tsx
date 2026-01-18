import React, { useState, useEffect } from 'react';
import { createLetter, getFriends, saveDraft, deleteDraft } from '../../services/letterService';
import Parse from '../../services/parseClient';
import { ImageGalleryModal } from '../common/ImageGalleryModal';

export const ComposeScreen = ({ onClose, onSent, draft }: { onClose: () => void; onSent: () => void; draft?: any }) => {
    const [subject, setSubject] = useState(draft?.subject || '');
    const [body, setBody] = useState(draft?.body || '');
    const [sending, setSending] = useState(false);

    // Social Mode State
    const [mode, setMode] = useState('HOLD'); // 'HOLD' (Draft) | 'SEND'
    const [friends, setFriends] = useState<any[]>([]);
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
    const [keepCopy, setKeepCopy] = useState(false);

    // Attachments
    const [attachmentUrls, setAttachmentUrls] = useState<string[]>(draft?.images || []); // URLs only (from Gallery/History)

    // Gallery
    const [showGallery, setShowGallery] = useState(false);

    useEffect(() => {
        const loadFriends = async () => {
            try {
                const f = await getFriends();
                setFriends(f);
            } catch (err) {
                console.error('Failed to load friends', err);
            }
        };
        loadFriends();
    }, []);

    const toggleRecipient = (username: string) => {
        if (selectedRecipients.includes(username)) {
            setSelectedRecipients(prev => prev.filter(u => u !== username));
        } else {
            if (selectedRecipients.length >= 3) return; // Max 3
            setSelectedRecipients(prev => [...prev, username]);
        }
    };

    const handleGallerySelect = (image: any) => {
        console.log('ComposeScreen handleGallerySelect:', image);
        if (attachmentUrls.length >= 3) {
            alert('Max 3 attachments allowed.');
            return;
        }
        // Robust check for object vs string (legacy safety)
        const url = image.url || (typeof image === 'string' ? image : null);

        if (!url) {
            console.error('Invalid image selected', image);
            return;
        }
        setAttachmentUrls(prev => [...prev, url]);
        setShowGallery(false);
    };

    const handleBurn = async () => {
        if (!draft?.id) return;
        if (!confirm('Are you sure you want to burn this draft? It cannot be recovered.')) return;

        setSending(true);
        try {
            await deleteDraft(draft.id);
            onSent(); // Close screen
        } catch (err) {
            console.error(err);
            alert('Failed to burn draft.');
            setSending(false);
        }
    };

    const handleAction = async () => {
        if (!subject || !body) return;

        setSending(true);
        try {
            // 1. Prepare Images
            // attachmentUrls now contains only valid URLs (from Gallery or Draft history)
            // Filter out any potential garbage
            const finalImageUrls = attachmentUrls.filter(u => u && typeof u === 'string');

            if (mode === 'HOLD') {
                // SAVE DRAFT
                await saveDraft({
                    draftId: draft?.id,
                    subject,
                    body,
                    images: finalImageUrls
                });
                alert('Draft Saved.');
                onSent();
            } else {
                // SEND
                if (selectedRecipients.length === 0) {
                    setSending(false);
                    return;
                }
                const recipients = selectedRecipients;
                await createLetter({
                    subject,
                    body,
                    images: finalImageUrls,
                    recipients,
                    keepCopy,
                    draftId: draft?.id
                });
                onSent();
            }
        } catch (error) {
            console.error(error);
            alert('Failed to process letter');
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-parchment z-50 flex flex-col p-8 font-mono text-ink">
            {showGallery && (
                <ImageGalleryModal
                    onClose={() => setShowGallery(false)}
                    onSelect={handleGallerySelect}
                />
            )}

            <header className="fixed top-0 left-0 right-0 bg-parchment p-8 z-40 border-b border-ink">
                <div className="flex justify-between items-center max-w-4xl mx-auto w-full">
                    <h1 className="text-xl font-bold uppercase tracking-widest">{draft ? 'Edit Draft' : 'Compose Letter'}</h1>
                    <button onClick={onClose} className="text-xs hover:text-klein underline">CANCEL</button>
                </div>
            </header>

            <div className="flex-1 flex flex-col space-y-4 max-w-2xl mx-auto w-full overflow-y-auto pt-24 pb-20">
                <div className="flex flex-col space-y-2">
                    <label className="text-xs uppercase tracking-widest opacity-60">Subject</label>
                    <input
                        className="bg-transparent border-b border-ink/30 focus:border-klein outline-none py-2 text-xl font-serif italic"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Regarding..."
                    />
                </div>

                <div className="flex flex-col space-y-2 min-h-[200px]">
                    <div className="flex justify-between items-end">
                        <label className="text-xs uppercase tracking-widest opacity-60">Message</label>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowGallery(true)}
                                className="text-xs uppercase tracking-widest cursor-pointer hover:text-klein flex items-center space-x-1 disabled:opacity-30"
                                disabled={attachmentUrls.length >= 3}
                            >
                                <span>+ Add Image</span>
                            </button>
                            <span className="text-xs opacity-40">({attachmentUrls.length}/3)</span>
                        </div>
                    </div>

                    <textarea
                        className="flex-1 bg-transparent border border-ink/10 p-4 focus:border-klein outline-none resize-none font-serif leading-relaxed"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your correspondence here..."
                    />

                    {attachmentUrls.length > 0 && (
                        <div className="flex space-x-2 pt-2">
                            {attachmentUrls.map((url, i) => (
                                <div key={i} className="w-16 h-16 border border-ink/20 relative">
                                    <img src={url} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Dispatch Options */}
                <div className="border-t border-ink pt-6 space-y-6">
                    <div className="flex space-x-4">
                        {draft && (
                            <button
                                onClick={handleBurn}
                                disabled={sending}
                                className="flex-1 py-3 text-xs uppercase tracking-widest border border-red-600/50 text-red-600 hover:bg-red-600 hover:text-parchment transition-colors"
                            >
                                Burn
                            </button>
                        )}
                        <button
                            onClick={() => setMode('HOLD')}
                            className={`flex-1 py-3 text-xs uppercase tracking-widest border transition-colors ${mode === 'HOLD' ? 'bg-ink text-parchment border-ink' : 'border-ink/20 opacity-50 hover:opacity-100'}`}
                        >
                            Save Draft
                        </button>
                        <button
                            onClick={() => setMode('SEND')}
                            className={`flex-1 py-3 text-xs uppercase tracking-widest border transition-colors ${mode === 'SEND' ? 'bg-ink text-parchment border-ink' : 'border-ink/20 opacity-50 hover:opacity-100'}`}
                        >
                            Send
                        </button>
                    </div>

                    {mode === 'SEND' && (
                        <div className="bg-ink/5 p-6 space-y-4 border border-ink/10 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div>
                                <div className="text-xs uppercase tracking-widest opacity-60 mb-2">Select Recipients (Max 3)</div>
                                <div className="flex flex-wrap gap-2">
                                    {friends.length === 0 && (
                                        <div className="text-sm font-serif italic opacity-50 w-full text-center py-4">
                                            No friends found. Invite users to grow your network.
                                        </div>
                                    )}
                                    {friends.map(f => {
                                        const pfp = f.profilePicture;
                                        const isSelected = selectedRecipients.includes(f.username);
                                        return (
                                            <button
                                                key={f.id}
                                                onClick={() => toggleRecipient(f.username)}
                                                className={`flex items-center space-x-2 px-3 py-2 text-xs font-mono border transition-all ${isSelected ? 'bg-klein text-parchment border-klein shadow-md' : 'border-ink/30 hover:border-klein bg-parchment'}`}
                                            >
                                                {pfp ? (
                                                    <img src={pfp} className={`w-5 h-5 object-cover ${!isSelected && 'grayscale'}`} />
                                                ) : (
                                                    <div className="w-5 h-5 bg-ink/10 flex items-center justify-center text-[8px] font-bold">?</div>
                                                )}
                                                <span>{f.username}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>


                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleAction}
                                disabled={sending || (mode === 'SEND' && selectedRecipients.length === 0)}
                                className="bg-klein text-parchment px-12 py-4 text-sm tracking-widest uppercase hover:opacity-90 disabled:opacity-50 shadow-lg transition-transform active:scale-95"
                            >
                                {sending ? 'Processing...' : (mode === 'SEND' ? 'Send Correspondence' : 'Save Draft')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
