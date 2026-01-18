import { useState, useEffect } from 'react';
import Parse from '../services/parseClient';
import { getMailbox, getArchive, getFriendRequests, getSent, getDrafts } from '../services/letterService';

export const useMailbox = (type = 'inbox') => {
    const [letters, setLetters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLetters = async () => {
        try {
            setLoading(true);
            let results = [];
            if (type === 'inbox') {
                const letters = await getMailbox();
                const requests = await getFriendRequests();

                // Map requests to pseudo-letters
                const requestLetters = requests.map(r => ({
                    id: r.id,
                    type: 'request',
                    subject: 'Friend Request',
                    body: `User ${r.fromUser} would like to connect with you via the Relay network.`,
                    sender: r.fromUser,
                    receivedAt: r.createdAt,
                    images: [],
                    requestId: r.id,
                    originalAuthor: 'System',
                    chainIndex: 0
                }));

                results = [...letters, ...requestLetters].sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
            } else if (type === 'sent') {
                results = await getSent();
            } else if (type === 'draft') {
                results = await getDrafts();
            } else {
                results = await getArchive();
            }
            setLetters(results);
        } catch (err) {
            console.error('Error fetching mailbox:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let subscription;

        const setupLiveQuery = async () => {
            const currentUser = Parse.User.current();
            if (!currentUser) return;

            const Letter = Parse.Object.extend('Letter');
            const query = new Parse.Query(Letter);
            query.equalTo('recipient', currentUser);

            if (type === 'inbox') {
                // Hard to replicate OR logic in LiveQuery subscription easily without complex client
                // But most simple queries work.
                // Ideally we listen to ALL changes to letters we hold, and then client-side filter or re-fetch.
                // Let's just listen to all held letters for now and refresh.
            }

            subscription = await query.subscribe();

            // Handle new letters entering mailbox
            subscription.on('create', (letter) => {
                fetchLetters();
            });

            subscription.on('enter', (letter) => {
                fetchLetters();
            });

            // Handle letters leaving mailbox (forwarded/deleted)
            subscription.on('leave', (letter) => {
                setLetters((prev) => prev.filter((l) => l.id !== letter.id));
            });

            subscription.on('delete', (letter) => {
                setLetters((prev) => prev.filter((l) => l.id !== letter.id));
            });

            // Handle updates
            subscription.on('update', (letter) => {
                fetchLetters();
            });
        };

        fetchLetters();
        setupLiveQuery();

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [type]); // Re-run when type changes

    return { letters, loading, error, refresh: fetchLetters };
};

