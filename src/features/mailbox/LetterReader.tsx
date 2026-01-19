import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Parse from '../../services/parseClient';
import { forwardLetter, burnLetter, getComments, getFriends, sendFriendRequest, respondToFriendRequest, markAsRead } from '../../services/letterService';

interface LetterReaderProps {
    letter: any;
    onClose: () => void;
    onActionComplete: () => void;
    isArchived?: boolean;
    isSent?: boolean;
}

export const LetterReader = ({ letter, onClose, onActionComplete, isArchived = false, isSent = false }: LetterReaderProps) => {
    const [mode, setMode] = useState('READ'); // READ, FORWARD
    const [targetUser, setTargetUser] = useState('');
    const [commentText, setCommentText] = useState('');
    const [processing, setProcessing] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Comments state
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(true);

    // Friends state (Loaded on mount now for connection check)
    const [friends, setFriends] = useState<any[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(true);

    // Derived from POJO (letterService returns POJOs now)
    const { id, contentId, subject, body, images, sender, originalAuthor, chainIndex, type, requestId, previousSender, previousSenderId } = letter;
    const isRequest = type === 'request';

    const currentUser = Parse.User.current();
    const currentUsername = currentUser ? currentUser.get('username') : '';

    useEffect(() => {
        const loadData = async () => {
            // Load Comments
            if (contentId) {
                try {
                    const c = await getComments(contentId);
                    setComments(c);
                } catch (err) {
                    console.error('Failed to load comments', err);
                } finally {
                    setLoadingComments(false);
                }
            } else {
                setLoadingComments(false);
            }

            // Load Friends (for Forwarding list AND Connection check)
            try {
                const f = await getFriends();
                setFriends(f);
            } catch (err) {
                console.error("Failed to load friends", err);
            } finally {
                setLoadingFriends(false);
            }
        };
        loadData();


        // Mark as Read if not already (and not sent/archived/request)
        if (!letter.read && !isSent && letter.type !== 'request') {
            markAsRead(id);
        }
    }, [contentId]);

    const isFriend = friends.some(f => f.username === previousSender);
    const isSelf = previousSender === currentUsername;
    const canConnect = previousSender && !isFriend && !isSelf;

    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);

    const toggleRecipient = (username: string) => {
        if (selectedRecipients.includes(username)) {
            setSelectedRecipients(prev => prev.filter(u => u !== username));
        } else {
            if (selectedRecipients.length >= 3) return; // Max 3
            setSelectedRecipients(prev => [...prev, username]);
        }
    };

    const handleForward = async () => {
        if (selectedRecipients.length === 0) return;
        setProcessing(true);
        try {
            const keepCopy = confirm('Do you wish to keep a copy in your Archive? (Max 10)');

            await forwardLetter(id, selectedRecipients, commentText, keepCopy);
            onActionComplete();
        } catch (error: any) {
            console.error(error);
            alert('Failed to forward: ' + error.message);
            setProcessing(false);
        }
    };

    const handleBurn = async () => {
        if (!confirm('Are you sure you want to BURN this letter?')) return;
        setProcessing(true);
        try {
            await burnLetter(id);
            onActionComplete();
        } catch (error: any) {
            console.error(error);
            alert('Failed to burn: ' + error.message);
            setProcessing(false);
        }
    };

    const handleRequestAction = async (action: 'accept' | 'reject') => {
        setProcessing(true);
        try {
            await respondToFriendRequest(requestId, action);
            onActionComplete(); // Close and refresh
        } catch (error: any) {
            alert('Error: ' + error.message);
            setProcessing(false);
        }
    };

    const handleConnect = async () => {
        if (!previousSenderId) return;
        if (!confirm(`Send a friend request to ${previousSender}?`)) return;

        try {
            await sendFriendRequest(previousSenderId);
            alert('Friend Request Sent!');
        } catch (err: any) {
            alert('Failed: ' + err.message);
        }
    };

    const canPerformActions = !isSent;

    if (mode === 'FORWARD') {
        return (
            <div className="fixed inset-0 bg-parchment/95 z-50 flex items-center justify-center p-4">
                <div className="bg-parchment border border-ink p-8 max-w-md w-full shadow-2xl relative">
                    <button onClick={() => setMode('READ')} className="absolute top-4 right-4 text-xs hover:text-ink/50">CANCEL</button>
                    <h2 className="text-lg font-bold uppercase tracking-widest mb-6 text-ink">Forward Letter</h2>

                    <div className="space-y-4">
                        <div>
                            <div className="text-xs uppercase tracking-widest opacity-60 mb-2">Select Recipients (Max 3)</div>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-ink/10">
                                {friends.length === 0 && (
                                    <div className="text-sm font-serif italic opacity-50 w-full text-center py-4">
                                        No friends found.
                                    </div>
                                )}
                                {friends.map(f => {
                                    const pfp = f.profilePicture;
                                    const isSelected = selectedRecipients.includes(f.username);
                                    const isSender = f.username === previousSender || f.username === sender;

                                    return (
                                        <button
                                            key={f.id}
                                            onClick={() => !isSender && toggleRecipient(f.username)}
                                            disabled={isSender}
                                            className={`flex items-center space-x-2 px-3 py-2 text-xs font-mono border transition-all ${isSender
                                                ? 'opacity-20 cursor-not-allowed border-ink/10 bg-ink/5'
                                                : isSelected
                                                    ? 'bg-klein text-parchment border-klein shadow-md'
                                                    : 'border-ink/30 hover:border-klein bg-parchment'
                                                }`}
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

                        <div>
                            <label className="text-xs uppercase tracking-widest opacity-60 block mb-1">Add Annotation</label>
                            <textarea
                                className="w-full bg-ink/5 border border-ink/20 p-2 font-serif text-sm h-20 outline-none resize-none"
                                placeholder="Add your thoughts..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleForward}
                            disabled={processing || selectedRecipients.length === 0}
                            className="w-full bg-ink text-parchment py-3 text-xs tracking-widest uppercase mt-4 hover:opacity-90 disabled:opacity-50"
                        >
                            {processing ? 'Sending...' : 'Confirm Forward'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-parchment z-50 flex flex-col p-8 font-mono text-ink overflow-y-auto">
            <header className="flex justify-between items-center border-b border-ink pb-4 mb-8">
                <div className="text-xs uppercase tracking-widest opacity-50">
                    {isArchived ? '[ ARCHIVED ]' : `[ HELD - Chain #${chainIndex} ]`}
                </div>
                <button onClick={onClose} className="text-xs hover:text-ink/60 underline">CLOSE</button>
            </header>

            <div className="max-w-2xl mx-auto w-full flex-1">
                {/* Provenance Header */}
                <div className="border border-ink/20 p-4 mb-8 text-xs space-y-1 bg-ink/5">
                    <div className="flex justify-between">
                        <span className="opacity-50 uppercase">Originator:</span>
                        <span className="font-bold">{originalAuthor || 'UNKNOWN'}</span>
                    </div>
                    {isSent ? (
                        <div className="flex justify-between">
                            <span className="opacity-50 uppercase">Sent To:</span>
                            <span className="font-bold text-klein truncate ml-4 text-right">
                                {letter.recipients && letter.recipients.length > 0
                                    ? letter.recipients.join(', ')
                                    : 'Unknown'}
                            </span>
                        </div>
                    ) : (
                        <>
                            {previousSender && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="opacity-50 uppercase">Forwarded By:</span>
                                        <span className="font-bold text-ink">{previousSender}</span>
                                    </div>
                                    <div className="flex justify-end pr-1 text-ink/30 text-[10px] leading-3">
                                        ↓
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between">
                                <span className="opacity-50 uppercase">Received From:</span>
                                <span className="font-bold text-klein">{sender || 'SELF'}</span>
                            </div>
                        </>
                    )}
                </div>

                <h1 className="text-4xl font-serif italic mb-8">{subject}</h1>

                <div className="font-serif text-lg leading-relaxed mb-12 markdown-body">
                    <ReactMarkdown
                        components={{
                            p: ({ node, ...props }: any) => <p className="mb-4" {...props} />,
                            h1: ({ node, ...props }: any) => <h1 className="text-2xl font-bold uppercase tracking-widest mb-4 mt-8" {...props} />,
                            h2: ({ node, ...props }: any) => <h2 className="text-xl font-bold uppercase tracking-widest mb-3 mt-6" {...props} />,
                            h3: ({ node, ...props }: any) => <h3 className="text-lg font-bold uppercase tracking-widest mb-2 mt-4" {...props} />,
                            ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 mb-4" {...props} />,
                            ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 mb-4" {...props} />,
                            li: ({ node, ...props }: any) => <li className="mb-1" {...props} />,
                            a: ({ node, ...props }: any) => <a className="text-klein underline hover:opacity-80 transition-colors" {...props} />,
                            blockquote: ({ node, ...props }: any) => <blockquote className="border-l-2 border-ink/30 pl-4 italic my-4" {...props} />,
                            code: ({ node, ...props }: any) => <code className="bg-ink/10 font-mono text-sm px-1 py-0.5 rounded" {...props} />
                        }}
                    >
                        {body}
                    </ReactMarkdown>
                </div>

                {/* Images if any */}
                {images && images.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-12">
                        {images.map((img: any, i: number) => (
                            <img
                                key={i}
                                src={img.url ? img.url : img}
                                onClick={() => setSelectedImage(img.url ? img.url : img)}
                                className="w-full h-32 object-cover border border-ink/20 grayscale hover:grayscale-0 transition-all cursor-zoom-in"
                            />
                        ))}
                    </div>
                )}

                {/* Lightbox Overlay */}
                {selectedImage && (
                    <div
                        className="fixed inset-0 z-[60] bg-parchment/95 flex items-center justify-center p-8 cursor-zoom-out"
                        onClick={() => setSelectedImage(null)}
                    >
                        <img
                            src={selectedImage}
                            className="max-w-full max-h-full object-contain shadow-2xl border border-ink"
                        />
                        <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 text-xs hover:text-ink/60 underline">CLOSE</button>
                    </div>
                )}

                {/* Comments / Annotations */}
                {!isRequest && (
                    <div className="mb-12 border-t border-ink/20 pt-8">
                        <h3 className="text-xs uppercase tracking-widest opacity-50 mb-4">Annotations</h3>
                        {loadingComments ? (
                            <div className="text-sm italic opacity-30">Loading history...</div>
                        ) : comments.length === 0 ? (
                            <div className="text-sm italic opacity-30">No annotations yet.</div>
                        ) : (
                            <div className="space-y-6">
                                {comments.map((c, i) => (
                                    <div key={i} className="pl-4 border-l border-ink/20">
                                        <div className="text-[10px] uppercase tracking-wide opacity-50 mb-1">{c.author} wrote:</div>
                                        <div className="font-serif text-sm">{c.text}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions Footer */}
                {canPerformActions && (
                    isRequest ? (
                        <div className="border-t border-ink pt-8 flex justify-center space-x-8 pb-20">
                            <button
                                onClick={() => handleRequestAction('reject')}
                                className="text-xs text-red-700 tracking-widest uppercase hover:bg-red-50 px-6 py-3 border border-red-200 hover:border-red-400 transition-colors"
                            >
                                {processing ? '...' : 'Decline'}
                            </button>
                            <button
                                onClick={() => handleRequestAction('accept')}
                                className="bg-ink text-parchment px-8 py-3 text-xs tracking-widest uppercase hover:bg-klein transition-colors shadow-lg"
                            >
                                {processing ? 'Processing...' : 'Accept Connection'}
                            </button>
                        </div>
                    ) : !isArchived ? (
                        <div className="border-t border-ink pt-8 flex justify-between pb-20 items-center">
                            <div className="flex gap-4">
                                <button
                                    onClick={handleBurn}
                                    className="text-xs text-red-700 tracking-widest uppercase hover:bg-red-50 px-4 py-2 border border-transparent hover:border-red-200 transition-colors"
                                >
                                    {processing ? '...' : 'Burn'}
                                </button>
                                {canConnect && (
                                    <button
                                        onClick={handleConnect}
                                        className="text-xs text-klein tracking-widest uppercase hover:bg-klein/5 px-4 py-2 border border-klein/20 hover:border-klein transition-colors"
                                    >
                                        + Connect with {previousSender}
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={() => setMode('FORWARD')}
                                className="bg-ink text-parchment px-6 py-2 text-xs tracking-widest uppercase hover:bg-ink/80 transition-colors"
                            >
                                Forward
                            </button>
                        </div>
                    ) : (
                        <div className="border-t border-ink pt-8 flex justify-between pb-20 items-center">
                            <div className="text-xs opacity-40 uppercase tracking-widest">
                                Archived Copy
                            </div>
                            <button
                                onClick={handleBurn}
                                className="text-xs text-red-700 tracking-widest uppercase hover:bg-red-50 px-4 py-2 border border-transparent hover:border-red-200 transition-colors"
                            >
                                {processing ? '...' : 'Burn (Remove)'}
                            </button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};
