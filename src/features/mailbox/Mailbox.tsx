import React from 'react';
import { useMailbox } from '../../hooks/useMailbox';
import LetterPreview from './LetterPreview';

export const Mailbox = () => {
    const { letters, loading, error } = useMailbox();

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center font-mono text-xs animate-pulse">
                [ CHECKING POSTAL RELAYS... ]
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center font-mono text-xs text-klein">
                [ ERROR: CONNECTION LOST ]
            </div>
        );
    }

    if (letters.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center font-mono text-ink/40 space-y-4">
                <div className="text-4xl text-ink/20">∅</div>
                <div className="text-xs tracking-widest uppercase">Mailbox Empty</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col border border-ink bg-parchment min-h-[500px] max-w-2xl mx-auto my-8">
            {/* Mailbox Header */}
            <div className="border-b border-ink p-4 flex justify-between items-center bg-parchment sticky top-0 z-10">
                <h1 className="font-mono font-bold uppercase tracking-widest text-sm">
                    Incoming Correspondence
                </h1>
                <div className="font-mono text-xs">
                    COUNT: {letters.length}
                </div>
            </div>

            {/* Letters Stack */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {letters.map((letter) => (
                    <LetterPreview key={letter.id} letter={letter} />
                ))}
            </div>
        </div>
    );
};


