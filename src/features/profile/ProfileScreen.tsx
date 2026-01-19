import React, { useState, useEffect } from 'react';
import Parse from '../../services/parseClient';
import { generateInvite as genInviteAuth } from '../../services/authService';
import { saveImageToLibrary as saveImgService, getProfileStats } from '../../services/letterService';
import { ImageGalleryModal } from '../common/ImageGalleryModal';

export const ProfileScreen = ({ onClose, targetUser }: { onClose: () => void, targetUser?: any }) => {
    const currentUser = Parse.User.current();
    const user = targetUser || currentUser;
    const isMe = user?.id === currentUser?.id;

    const [stats, setStats] = useState({ referrals: 0, friends: 0, sent: 0, impressions: 0, bio: '' });
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [showGallery, setShowGallery] = useState(false);
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioText, setBioText] = useState('');

    useEffect(() => {
        if (user) {
            const loadStats = async () => {
                try {
                    const data = await getProfileStats(user.id);
                    setStats(data);
                    if (data.bio) setBioText(data.bio);
                } catch (err) {
                    console.error("Failed to load profile stats", err);
                }
            };
            loadStats();
        }
    }, [user]);

    const handleSaveBio = async () => {
        if (!user || !isMe) return;
        try {
            user.set('bio', bioText);
            await user.save();
            setStats(prev => ({ ...prev, bio: bioText }));
            setIsEditingBio(false);
        } catch (err: any) {
            console.error("Failed to save bio", err);
            alert("Failed to save bio: " + err.message);
        }
    };

    const handleGenerateInvite = async () => {
        try {
            const result = await genInviteAuth();
            setGeneratedCode(result.code);
        } catch (error) {
            console.error(error);
            alert('Failed to generate invite');
        }
    };

    const handleGallerySelect = async (image: any) => {
        console.log('ProfileScreen handleGallerySelect:', image);
        if (!user) {
            console.error('No user found');
            return;
        }
        if (!image.file) {
            console.error('No image file in selection', image);
            // Fallback: If we have a URL but no File object, we can't set it as PFP easily via Pointer unless we create a new File from URL?
            // Or maybe 'getRecentImages' failed to populate 'file'?
            return;
        }

        setUploading(true);
        try {
            // Reuse existing Parse.File
            user.set('profilePicture', image.file);
            await user.save();
            alert('Profile Picture Updated from Library');
            setShowGallery(false);
        } catch (error) {
            console.error(error);
            alert('Failed to update PFP');
        } finally {
            setUploading(false);
        }
    };



    const pfpUrl = user?.get('profilePicture')?.url();

    return (
        <div className="fixed inset-0 bg-parchment z-50 flex flex-col p-8 font-mono text-ink overflow-y-auto">
            {showGallery && (
                <ImageGalleryModal
                    onClose={() => setShowGallery(false)}
                    onSelect={handleGallerySelect}
                />
            )}

            <header className="flex justify-between items-center border-b border-ink pb-4 mb-8">
                <h1 className="text-xl font-bold uppercase tracking-widest">Identity Record</h1>
                <button onClick={onClose} className="text-xs hover:text-klein underline">CLOSE</button>
            </header>

            <div className="max-w-md mx-auto w-full space-y-8">
                {/* ID Card */}
                <div className="border border-ink p-6 flex items-start space-x-6">
                    <div className="relative w-24 h-24 bg-ink/5 border border-ink/20 flex items-center justify-center overflow-hidden group">
                        {pfpUrl ? (
                            <img src={pfpUrl} alt="PFP" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl opacity-20">?</span>
                        )}

                        {/* Hover Overlay - Only for Me */}
                        {isMe && (
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                <button
                                    onClick={() => setShowGallery(true)}
                                    className="text-parchment text-[10px] uppercase text-center hover:text-klein tracking-widest"
                                >
                                    Update Photo
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 space-y-2">
                        <div className="text-xs uppercase tracking-widest opacity-50">Alias</div>
                        <div className="text-2xl font-serif italic">{user?.get('username')}</div>

                        <div className="pt-2">
                            <div className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Bio</div>
                            {isEditingBio ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={bioText}
                                        onChange={(e) => setBioText(e.target.value)}
                                        className="w-full bg-ink/5 border border-ink/20 p-2 text-sm font-serif italic focus:outline-none focus:border-klein resize-none"
                                        rows={3}
                                        maxLength={140}
                                        placeholder="Enter your public bio..."
                                    />
                                    <div className="flex space-x-2 text-[10px] uppercase tracking-widest">
                                        <button onClick={handleSaveBio} className="hover:text-klein underline">Save</button>
                                        <button onClick={() => { setIsEditingBio(false); setBioText(stats.bio || ''); }} className="hover:text-red-700 underline">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => isMe && setIsEditingBio(true)}
                                    className={`text-sm font-serif italic leading-relaxed ${isMe ? "cursor-pointer hover:bg-ink/5 -ml-2 p-2 rounded transition-colors group/bio" : ""}`}
                                >
                                    {stats.bio ? (
                                        stats.bio
                                    ) : (
                                        <span className="opacity-30">No bio logged.</span>
                                    )}
                                    {isMe && !stats.bio && (
                                        <span className="opacity-50 ml-2 text-[10px] uppercase not-italic tracking-widest group-hover/bio:text-klein">Click to add</span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex space-x-6 pt-4">
                            <div>
                                <div className="text-[10px] uppercase tracking-widest opacity-50">Network</div>
                                <div className="text-xl font-bold">{stats.friends}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-widest opacity-50">Sent</div>
                                <div className="text-xl font-bold">{stats.sent}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-widest opacity-50">Impressions</div>
                                <div className="text-xl font-bold">{stats.impressions}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-widest opacity-50">Referrals</div>
                                <div className="text-xl font-bold">{stats.referrals}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Invite Generation - Only for Me */}
                {isMe && (
                    <div className="border-t border-ink pt-8">
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Grow Network</h3>
                        <div className="bg-ink/5 p-6 text-center space-y-4">
                            {generatedCode ? (
                                <div className="animate-in fade-in zoom-in duration-300">
                                    <div className="text-xs uppercase opacity-50 mb-1">Single-Use Code</div>
                                    <div className="text-4xl font-mono font-bold tracking-[0.5em] text-klein selection:bg-ink selection:text-parchment">
                                        {generatedCode}
                                    </div>
                                    <p className="text-[10px] mt-2 opacity-60">Share this code to automatically friend a new user.</p>
                                    <button onClick={() => setGeneratedCode('')} className="mt-4 text-xs underline hover:text-klein">Generate Another</button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleGenerateInvite}
                                    className="bg-ink text-parchment px-8 py-3 text-xs uppercase tracking-widest hover:opacity-90"
                                >
                                    Generate Invite Code
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
