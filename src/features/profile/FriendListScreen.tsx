import React, { useState, useEffect } from 'react';
import { getFriends, redeemFriendCode } from '../../services/letterService';
import Parse from '../../services/parseClient';

import { ProfileScreen } from './ProfileScreen';

export const FriendListScreen = ({ onClose }: { onClose: () => void }) => {
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFriend, setSelectedFriend] = useState<any>(null);
    const [connectCode, setConnectCode] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    const handleConnect = async () => {
        if (!connectCode.trim()) return;
        setIsConnecting(true);
        try {
            const result = await redeemFriendCode(connectCode.trim().toUpperCase());
            alert(result.message);
            setConnectCode('');
            // Reload friends
            const f = await getFriends();
            setFriends(f);
        } catch (err: any) {
            console.error(err);
            alert('Connection Failed: ' + err.message);
        } finally {
            setIsConnecting(false);
        }
    };

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

    if (selectedFriend) {
        // Create a temporary Parse User-like object or fetch the full user
        // The friend object from getFriends has basic fields.
        // We might need to construct a lightweight Parse.User placeholder or fetch.
        // Since we have the ID, we can just pass it to ProfileScreen if it did its own fetch, 
        // but ProfileScreen expects a Parse.User object.
        // Let's create a partial object.
        const User = Parse.Object.extend('_User');
        const userObj = new User();
        userObj.id = selectedFriend.id;
        userObj.set('username', selectedFriend.username);
        // Note: ProfileScreen will fetch stats using the ID. PFP is handled via stats or user Get?
        // Actually ProfileScreen uses user.get('profilePicture') for the image.
        // So we should probably pass a basic object that has these.
        if (selectedFriend.profilePicture) {
            // Mock a file object with url() method if needed, or update ProfileScreen to handle strings
            // Re-reading ProfileScreen: user?.get('profilePicture')?.url()
            // We can mock this structure.
            userObj.set('profilePicture', { url: () => selectedFriend.profilePicture });
        }

        return <ProfileScreen onClose={() => setSelectedFriend(null)} targetUser={userObj} />;
    }

    return (
        <div className="fixed inset-0 bg-parchment z-50 flex flex-col p-8 font-mono text-ink overflow-y-auto">
            <header className="flex justify-between items-center border-b border-ink pb-4 mb-8">
                <h1 className="text-xl font-bold uppercase tracking-widest">Network Dossier</h1>
                <button onClick={onClose} className="text-xs hover:text-klein underline">CLOSE</button>
            </header>

            <div className="max-w-2xl mx-auto w-full space-y-8">
                {/* Connect Section */}
                <div className="bg-ink/5 p-4 flex items-center space-x-4 border border-ink/10">
                    <input
                        type="text"
                        value={connectCode}
                        onChange={(e) => setConnectCode(e.target.value)}
                        placeholder="ENTER INVITE CODE"
                        className="flex-1 bg-transparent border-b border-ink/30 py-2 text-sm font-mono focus:outline-none focus:border-klein uppercase tracking-wider placeholder:text-ink/30"
                    />
                    <button
                        onClick={handleConnect}
                        disabled={isConnecting || !connectCode}
                        className="bg-ink text-parchment px-4 py-2 text-[10px] uppercase tracking-widest hover:bg-klein disabled:opacity-50 transition-colors"
                    >
                        {isConnecting ? '...' : 'Connect'}
                    </button>
                </div>

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
                                <div
                                    key={friend.id}
                                    onClick={() => setSelectedFriend(friend)}
                                    className="border border-ink/20 p-4 flex items-center space-x-4 hover:bg-ink/5 transition-colors cursor-pointer"
                                >
                                    <div className="w-12 h-12 bg-ink/10 flex-shrink-0">
                                        {pfp ? (
                                            <img src={pfp} className="w-full h-full object-cover grayscale" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-20 font-bold text-lg">?</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm tracking-wide flex items-center space-x-2">
                                            <span>{friend.username}</span>
                                            {friend.type && (
                                                <span className={`text-[8px] px-1 py-0.5 border rounded uppercase ${friend.type === 'ref' ? 'border-ink/30 text-ink/50' :
                                                        friend.type === 'code' ? 'border-klein text-klein' :
                                                            'border-ink text-ink'
                                                    }`}>
                                                    {friend.type}
                                                </span>
                                            )}
                                        </div>
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
