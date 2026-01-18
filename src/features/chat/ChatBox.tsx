import React, { useState, useEffect, useRef } from 'react';
import Parse from '../../services/parseClient';

export const ChatBox = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [friends, setFriends] = useState([]);

    // For now, Global Friend Chat (all friends in one channel? Or 1-on-1?)
    // "Option to directly message friends in a live chat box" implies selection.
    // Let's do a simple list of friends, click to chat? 
    // Complexity constraint: Keep it simple. Single "Lobby" for friends? 
    // Or just a general "Chat" where you can type. 
    // Let's implement a simple global channel for now to verify realtime.

    useEffect(() => {
        if (!isOpen) return;

        let subscription;

        const setupChat = async () => {
            const Message = Parse.Object.extend('Message');
            const query = new Parse.Query(Message);
            query.descending('createdAt');
            query.limit(20);

            // Initial fetch
            const results = await query.find();
            setMessages(results.reverse());

            // Subscribe
            subscription = await query.subscribe();
            subscription.on('create', (msg) => {
                setMessages(prev => [...prev, msg]);
            });
        };

        setupChat();

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await Parse.Cloud.run('sendMessage', { content: newMessage });
            setNewMessage('');
        } catch (err) {
            console.error(err);
        }
    };

    const scrollRef = useRef<HTMLDivElement>(null);
    const isAtBottomRef = useRef(true); // Default to true to scroll on initial load

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        // Check if we are within 50px of the bottom
        isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;
    };

    // Auto-scroll effect
    useEffect(() => {
        if (isAtBottomRef.current && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        // Scroll on open
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [isOpen]);

    return (
        <div className={`fixed bottom-0 right-8 z-50 flex flex-col items-end pointer-events-none`}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-ink text-parchment px-6 py-3 font-mono text-xs uppercase tracking-widest shadow-lg hover:bg-klein transition-colors pointer-events-auto rounded-t-lg"
            >
                {isOpen ? 'Close Feed' : 'Live Wire'}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="bg-parchment border border-ink shadow-2xl w-80 h-96 flex flex-col pointer-events-auto">
                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs scroll-smooth"
                    >
                        {messages.map((msg) => (
                            <div key={msg.id} className="flex flex-col">
                                <span className={`font-bold ${msg.get('authorName') === Parse.User.current()?.get('username') ? 'text-klein' : 'opacity-50'}`}>
                                    {msg.get('authorName')}
                                </span>
                                <span className="opacity-80 break-words">{msg.get('content')}</span>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSend} className="border-t border-ink p-2 flex">
                        <input
                            className="flex-1 bg-transparent border-none outline-none text-xs font-mono"
                            placeholder="To the wire..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button type="submit" className="text-klein font-bold px-2">→</button>
                    </form>
                </div>
            )}
        </div>
    );
};
