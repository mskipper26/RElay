import React, { useState, useEffect } from 'react';
import { createLetter, getFriends } from '../../services/letterService';
import Parse from '../../services/parseClient';

export const ComposeScreen = ({ onClose, onSent }: { onClose: () => void; onSent: () => void }) => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);

    // Social Mode State
    const [mode, setMode] = useState('HOLD'); // 'HOLD' | 'SEND'
    const [friends, setFriends] = useState<any[]>([]);
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
    const [keepCopy, setKeepCopy] = useState(false);

    // Attachments
    const [attachments, setAttachments] = useState<any[]>([]); // File objects
    const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]); // Previews

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

    const handleFileSelect = (e: any) => {
        const files = Array.from(e.target.files);
        if (files.length + attachments.length > 3) {
            alert('Max 3 attachments allowed.');
            return;
        }

        const newAttachments = [...attachments, ...files];
        setAttachments(newAttachments);

        // Generate previews
        const newUrls = files.map((f: any) => URL.createObjectURL(f));
        setAttachmentUrls(prev => [...prev, ...newUrls]);
    };

    const handleSend = async () => {
        if (!subject || !body) return;
        if (mode === 'SEND' && selectedRecipients.length === 0) return;

        setSending(true);
        try {
            // 1. Upload Images if any
            let imageUrls: string[] = [];
            if (attachments.length > 0) {
                const results = await Promise.all(attachments.map(async (file) => {
                    const parseFile = new Parse.File(file.name, file);
                    await parseFile.save();
                    return parseFile.url();
                }));
                imageUrls = results.filter((u): u is string => !!u);
            }

            const recipients = mode === 'SEND' ? selectedRecipients : [];
            // If Holding, keepCopy is implicit/logic handled by backend (Hold = Author Copy).
            // But our createLetter signature is (subject, body, images, recipients, keepCopy).
            // If recipients=[], keepCopy is irrelevant (always kept).
            await createLetter({ subject, body, images: imageUrls, recipients, keepCopy });
            onSent();
        } catch (error) {
            console.error(error);
            alert('Failed to send letter');
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-parchment z-50 flex flex-col p-8 font-mono text-ink">
            <header className="flex justify-between items-center border-b border-ink pb-4 mb-4">
                <h1 className="text-xl font-bold uppercase tracking-widest">Compose Letter</h1>
                <button onClick={onClose} className="text-xs hover:text-klein underline">CANCEL</button>
            </header>

            <div className="flex-1 flex flex-col space-y-4 max-w-2xl mx-auto w-full overflow-y-auto pb-20">
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
                    <div className="flex justify-between">
                        <label className="text-xs uppercase tracking-widest opacity-60">Message</label>
                        <label className="text-xs uppercase tracking-widest opacity-60 cursor-pointer hover:text-klein">
                            + Attach Image ({attachments.length}/3)
                            <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileSelect} disabled={attachments.length >= 3} />
                        </label>
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
                        <button
                            onClick={() => setMode('HOLD')}
                            className={`flex-1 py-3 text-xs uppercase tracking-widest border transition-colors ${mode === 'HOLD' ? 'bg-ink text-parchment border-ink' : 'border-ink/20 opacity-50 hover:opacity-100'}`}
                        >
                            Draft & Hold
                        </button>
                        <button
                            onClick={() => setMode('SEND')}
                            className={`flex-1 py-3 text-xs uppercase tracking-widest border transition-colors ${mode === 'SEND' ? 'bg-ink text-parchment border-ink' : 'border-ink/20 opacity-50 hover:opacity-100'}`}
                        >
                            Send to Friend
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
                                        // Friend is a POJO now, profilePicture is a URL string
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

                            <label className="flex items-center space-x-3 cursor-pointer group mt-4">
                                <div className={`w-4 h-4 border border-ink flex items-center justify-center transition-colors ${keepCopy ? 'bg-klein border-klein' : 'bg-transparent'}`}>
                                    {keepCopy && <span className="text-parchment text-[10px]">✓</span>}
                                </div>
                                <input type="checkbox" checked={keepCopy} onChange={e => setKeepCopy(e.target.checked)} className="hidden" />
                                <span className="text-xs uppercase tracking-widest group-hover:text-klein transition-colors">Keep a Copy in Archive?</span>
                            </label>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSend}
                            disabled={sending || (mode === 'SEND' && selectedRecipients.length === 0)}
                            className="bg-klein text-parchment px-12 py-4 text-sm tracking-widest uppercase hover:opacity-90 disabled:opacity-50 shadow-lg transition-transform active:scale-95"
                        >
                            {sending ? 'Processing...' : (mode === 'SEND' ? 'Send Correspondence' : 'Sign & Hold')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
