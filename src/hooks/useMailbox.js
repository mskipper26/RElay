import { useState, useEffect } from 'react';
import Parse from '../services/parseClient';
import { getMailbox } from '../services/letterService';

export const useMailbox = () => {
    const [letters, setLetters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let subscription;

        const fetchLetters = async () => {
            try {
                setLoading(true);
                const results = await getMailbox();
                setLetters(results);
            } catch (err) {
                console.error('Error fetching mailbox:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        const setupLiveQuery = async () => {
            const currentUser = Parse.User.current();
            if (!currentUser) return;

            const Letter = Parse.Object.extend('Letter');
            const query = new Parse.Query(Letter);
            query.equalTo('currentHolders', currentUser);

            subscription = await query.subscribe();

            // Handle new letters entering mailbox
            subscription.on('create', (letter) => {
                setLetters((prev) => [letter, ...prev]);
            });

            subscription.on('enter', (letter) => {
                setLetters((prev) => [letter, ...prev]);
            });

            // Handle letters leaving mailbox (forwarded/deleted)
            subscription.on('leave', (letter) => {
                setLetters((prev) => prev.filter((l) => l.id !== letter.id));
            });

            subscription.on('delete', (letter) => {
                setLetters((prev) => prev.filter((l) => l.id !== letter.id));
            });

            // Handle updates (e.g. new comments on held letters)
            subscription.on('update', (letter) => {
                setLetters((prev) => prev.map((l) => (l.id === letter.id ? letter : l)));
            });
        };

        fetchLetters();
        setupLiveQuery();

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, []);

    return { letters, loading, error };
};
