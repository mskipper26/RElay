import React, { useState, useEffect } from 'react';
import { getFriends } from '../../services/letterService';
import Parse from '../../services/parseClient';

export const FriendListScreen = ({ onClose }: { onClose: () => void }) => {
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                // We need to fetch friends and maybe inclusion of their profileData?
                // Standard getFriends returns Parse.User objects. 
                // We can just access .get('profilePicture') and .get('referralCount') if ACLs/CLPs allow public read of these fields on User class
                // By default _User class fields might be public read, but restricted write.
                const f = await getFriends();
                setFriends(f);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div className="fixed inset-0 bg-parchment z-50 flex flex-col p-8 font-mono text-ink overflow-y-auto">
            <header className="flex justify-between items-center border-b border-ink pb-4 mb-8">
                <h1 className="text-xl font-bold uppercase tracking-widest">Network Dossier</h1>
                <button onClick={onClose} className="text-xs hover:text-klein underline">CLOSE</button>
            </header>

            <div className="max-w-2xl mx-auto w-full">
                {loading ? (
                    <div className="text-center opacity-50 text-xs uppercase tracking-widest">Fetching Network...</div>
                ) : friends.length === 0 ? (
                    <div className="text-center opacity-50 italic font-serif">Empty network. Generate invites to grow.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {friends.map(friend => {
                            // friend is now a POJO, profilePicture is a URL string
                            const pfp = friend.profilePicture;
                            return (
                                <div key={friend.id} className="border border-ink/20 p-4 flex items-center space-x-4 hover:bg-ink/5 transition-colors">
                                    <div className="w-12 h-12 bg-ink/10 flex-shrink-0">
                                        {pfp ? (
                                            <img src={pfp} className="w-full h-full object-cover grayscale" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-20 font-bold text-lg">?</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm tracking-wide">{friend.username}</div>
                                        <div className="text-[10px] uppercase opacity-50 mt-1">
                                            Referrals: {friend.referralCount || 0}
                                        </div>
                                    </div>

                                    {!friend.isLocked && (
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!confirm(`Remove ${friend.username} from your network?`)) return;
                                                // Call remove service
                                                try {
                                                    // Dynamic import to avoid circular dep issues in some bundlers if simpler
                                                    const { removeFriend } = await import('../../services/letterService');
                                                    await removeFriend(friend.id);
                                                    setFriends(prev => prev.filter(f => f.id !== friend.id));
                                                } catch (err: any) {
                                                    alert('Failed: ' + err.message);
                                                }
                                            }}
                                            className="text-[10px] text-red-700/50 hover:text-red-700 uppercase tracking-widest border border-transparent hover:border-red-200 px-2 py-1 transition-all"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
