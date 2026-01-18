import React, { useState, useEffect } from 'react';
import Parse from '../../services/parseClient';
import { generateInvite as genInviteAuth } from '../../services/authService';
import { saveImageToLibrary as saveImgService } from '../../services/letterService';
import { ImageGalleryModal } from '../common/ImageGalleryModal';

export const ProfileScreen = ({ onClose }: { onClose: () => void }) => {
    const user = Parse.User.current();
    const [stats, setStats] = useState({ referrals: 0, friends: 0 });
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [showGallery, setShowGallery] = useState(false);

    useEffect(() => {
        if (user) {
            const loadStats = async () => {
                // Count Friends (Friend Class)
                const Friend = Parse.Object.extend('Friend');
                const q1 = new Parse.Query(Friend);
                q1.equalTo('userA', user);
                const q2 = new Parse.Query(Friend);
                q2.equalTo('userB', user);
                const friendCount = await Parse.Query.or(q1, q2).count();

                // Count Referrals (InviteCode Class)
                const InviteCode = Parse.Object.extend('InviteCode');
                const inviteQuery = new Parse.Query(InviteCode);
                inviteQuery.equalTo('createdBy', user);
                inviteQuery.equalTo('isUsed', true);
                const referralCount = await inviteQuery.count();

                setStats({ referrals: referralCount, friends: friendCount });
            };
            loadStats();
        }
    }, [user]);

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

    const handleFileUpload = async (e: any) => {
        const file = e.target.files[0];
        if (!file || !user) return;

        setUploading(true);
        try {
            // Use service to save to library FIRST, then set as PFP
            const result = await saveImgService(file);

            // Re-fetch to get the file object? No, saveImageToLibrary returns {url, id}.
            // So we need to create a Parse.File again?
            // Actually, saveImageToLibrary saves a NEW file.
            // I can just use the manual logic here just like before, but ALSO save to library?
            // Or just use the original logic (creates File) and create an Image record pointing to it.
            // Let's use saveImageToLibrary, but we need the Parse.File object to set to user.
            // saveImageToLibrary saves the file. 
            // result.url is available.

            // To be robust:
            // 1. Save File.
            // 2. Create Image wrapper.
            // 3. Set User PFP to File.

            // Replicating saveImageToLibrary logic here to get the File object handle:
            const parseFile = new Parse.File(file.name, file);
            await parseFile.save();

            // Save to Library (Create Image)
            const ImageObject = Parse.Object.extend('Image');
            const imageRecord = new ImageObject();
            imageRecord.set('user', user);
            imageRecord.set('file', parseFile);
            imageRecord.setACL(new Parse.ACL(user));
            await imageRecord.save();

            // Set PFP
            user.set('profilePicture', parseFile);
            await user.save();

            alert('Profile Picture Updated');
        } catch (error) {
            console.error(error);
            alert('Upload Failed');
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

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2">
                            <label className="cursor-pointer text-parchment text-[10px] uppercase text-center hover:text-klein">
                                Upload
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                            <button
                                onClick={() => setShowGallery(true)}
                                className="text-parchment text-[10px] uppercase text-center hover:text-klein"
                            >
                                Library
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 space-y-2">
                        <div className="text-xs uppercase tracking-widest opacity-50">Alias</div>
                        <div className="text-2xl font-serif italic">{user?.get('username')}</div>

                        <div className="flex space-x-8 pt-4">
                            <div>
                                <div className="text-[10px] uppercase tracking-widest opacity-50">Referrals</div>
                                <div className="text-xl font-bold">{stats.referrals}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-widest opacity-50">Network</div>
                                <div className="text-xl font-bold">{stats.friends}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Invite Generation */}
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
            </div>
        </div>
    );
};
