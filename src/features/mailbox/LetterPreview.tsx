import React from 'react';
import { motion } from 'framer-motion';

export const LetterPreview = ({ letter, activeTab, onDelete }: { letter: any; activeTab: string; onDelete?: (e: React.MouseEvent) => void }) => {
    // letter is now a POJO from letterService
    const { subject, originalAuthor, chainIndex, id, body, recipients, read: isReadProp } = letter;
    const originatorName = originalAuthor || 'UNKNOWN';
    const chainCount = chainIndex || 1;

    // Logic:
    // Archive: Always look "read" (no bold, darker bg).
    // Sent: Look "read" ONLY if recipients have read it. Otherwise "unread" style (bright).
    // Inbox: Use isReadProp.

    let isSentRead = false;
    if (activeTab === 'sent') {
        if (Array.isArray(recipients) && recipients.length > 0 && typeof recipients[0] !== 'string') {
            // Check if ANY recipient has read it. 
            isSentRead = recipients.some((r: any) => r.read);
        } else {
            // Fallback for legacy
            isSentRead = true;
        }
    }

    const isActuallyRead = activeTab === 'archive' || activeTab === 'draft' || (activeTab === 'sent' ? isSentRead : isReadProp);

    // Visual: Read letters are darker.
    // Previously bg-ink/5 was too subtle. Trying bg-ink/10.
    // Unread (Inbox only) are clean parchment.
    const bgClass = isActuallyRead ? 'bg-ink/10' : 'bg-transparent';
    const textWeight = !isActuallyRead ? 'font-bold text-ink' : 'text-ink';

    // Header Logic
    let headerText: React.ReactNode = '';

    if (activeTab === 'sent') {
        // recipients is now [{ username, read }] or just strings if legacy/draft
        // But getSentBox returns objects now. Drafts might still be strings? 
        // Let's handle both.

        let recipientDisplay;
        if (Array.isArray(recipients) && recipients.length > 0) {
            if (typeof recipients[0] === 'string') {
                recipientDisplay = recipients.join(', ');
            } else {
                // It's objects { username, read }
                recipientDisplay = recipients.map((r: any, i: number) => (
                    <span key={i} className={r.read ? 'text-klein font-bold' : 'opacity-70'}>
                        {r.username}
                        {r.read && <span className="ml-1" title="Read">✓</span>}
                        {i < recipients.length - 1 ? ', ' : ''}
                    </span>
                ));
            }
        } else {
            recipientDisplay = 'Unknown';
        }

        headerText = <span>TO: {recipientDisplay}</span>;

    } else if (activeTab === 'draft') {
        headerText = 'DRAFT';
    } else {
        headerText = `FROM: ${originatorName}`;
    }

    // Snippet Logic (fade after 20 chars)
    const snippet = body ? (body.length > 20 ? body.substring(0, 20) : body) : 'No content';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border-b border-ink last:border-b-0 p-6 ${bgClass} hover:bg-ink/20 cursor-pointer group relative transition-colors`}
        >
            {/* Unread Indicator Bar - Only if NOT read and in Inbox */}
            {!isActuallyRead && activeTab === 'inbox' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-klein" />
            )}

            <div className="flex flex-col space-y-2">
                {/* Metadata Header */}
                <div className="flex justify-between items-baseline text-xs font-mono text-ink/60 uppercase tracking-wider">
                    <span className={`group-hover:text-klein transition-colors ${textWeight}`}>
                        {headerText}
                    </span>
                    <div className="flex items-center space-x-4">
                        {activeTab !== 'draft' && (
                            <div className="flex flex-col items-end">
                                <span>CHAIN: {chainCount}</span>
                                {letter.commentCount > 0 && (
                                    <span className="text-[10px] text-ink/40">
                                        {letter.commentCount} Note{letter.commentCount !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        )}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="text-ink/30 hover:text-red-600 transition-colors p-1"
                                title="Delete"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Subject */}
                <h3 className={`text-2xl font-serif italic leading-tight pr-8 ${textWeight}`}>
                    {subject || '(No Subject)'}
                </h3>

                {/* Footer / Snippet */}
                <div className="pt-2 text-[10px] font-mono opacity-50 relative">
                    <span className="whitespace-pre-wrap">{snippet}</span>
                    {body && body.length > 20 && (
                        <span className="bg-gradient-to-r from-transparent to-parchment absolute inset-y-0 right-0 w-8" />
                    )}
                    {/* Add ellipsis if needed, or rely on gradient */}
                    {body && body.length > 20 && <span>...</span>}
                </div>
            </div>
        </motion.div >
    );
};

export default LetterPreview;
