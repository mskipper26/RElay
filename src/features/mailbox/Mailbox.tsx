import React from 'react';
import { useMailbox } from '../../hooks/useMailbox';
import LetterPreview from './LetterPreview';
import { ComposeScreen } from './ComposeScreen';
import { LetterReader } from './LetterReader';

export const Mailbox = () => {
    const [activeTab, setActiveTab] = React.useState('inbox');
    const { letters, loading, error, refresh } = useMailbox(activeTab) as { letters: any[], loading: boolean, error: any, refresh: () => void };
    const [selectedLetter, setSelectedLetter] = React.useState(null);
    const [isComposing, setIsComposing] = React.useState(false);

    if (loading && !letters.length) { // Only show full loader if empty
        return (
            <div className="h-full flex items-center justify-center font-mono text-xs animate-pulse opacity-50">
                [ LOADING... ]
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

    if (isComposing) {
        return <ComposeScreen onClose={() => setIsComposing(false)} onSent={() => { setIsComposing(false); refresh(); }} />;
    }

    if (selectedLetter) {
        return (
            <LetterReader
                letter={selectedLetter}
                onClose={() => setSelectedLetter(null)}
                onActionComplete={() => { setSelectedLetter(null); refresh(); }}
                isArchived={activeTab === 'archive'}
                isSent={activeTab === 'sent'}
            />
        );
    }

    return (
        <div className="flex flex-col border border-ink bg-parchment min-h-[500px] max-w-2xl mx-auto my-8 relative">
            {/* Mailbox Header */}
            <div className="border-b border-ink p-4 bg-parchment sticky top-0 z-10 flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex space-x-6 text-sm font-mono tracking-widest uppercase">
                        <button
                            onClick={() => setActiveTab('inbox')}
                            className={`${activeTab === 'inbox' ? 'text-ink font-bold underline' : 'text-ink/40 hover:text-ink'}`}
                        >
                            Inbox
                        </button>
                        <button
                            onClick={() => setActiveTab('sent')}
                            className={`${activeTab === 'sent' ? 'text-ink font-bold underline' : 'text-ink/40 hover:text-ink'}`}
                        >
                            Sent
                        </button>
                        <button
                            onClick={() => setActiveTab('archive')}
                            className={`${activeTab === 'archive' ? 'text-ink font-bold underline' : 'text-ink/40 hover:text-ink'}`}
                        >
                            Archive
                        </button>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsComposing(true)}
                            className="bg-ink text-parchment px-4 py-1 text-xs font-mono uppercase tracking-widest hover:bg-klein transition-colors"
                        >
                            New Letter
                        </button>
                    </div>
                </div>
            </div>

            {/* Letters Stack */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {letters.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center font-mono text-ink/40 space-y-4">
                        <div className="text-4xl text-ink/20">∅</div>
                        <div className="text-xs tracking-widest uppercase">
                            {activeTab === 'inbox' ? 'No new mail' : activeTab === 'sent' ? 'No sent letters (v2)' : 'Archive empty'}
                        </div>
                    </div>
                ) : (
                    letters.map((letter) => (
                        <div key={letter.id} onClick={() => setSelectedLetter(letter)}>
                            <LetterPreview letter={letter} />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};


