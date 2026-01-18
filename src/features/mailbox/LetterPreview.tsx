import React from 'react';
import { motion } from 'framer-motion';

export const LetterPreview = ({ letter, activeTab }: { letter: any; activeTab: string }) => {
    // letter is now a POJO from letterService
    const { subject, originalAuthor, chainIndex, id, body, recipients } = letter;
    const originatorName = originalAuthor || 'UNKNOWN';
    const chainCount = chainIndex || 1;

    // "Unread" logic can remain simpler for now
    const isUnread = false;

    // Header Logic
    let headerText = '';
    if (activeTab === 'sent') {
        const toNames = recipients && recipients.length > 0 ? recipients.join(', ') : 'Unknown';
        headerText = `TO: ${toNames}`;
    } else if (activeTab === 'draft') {
        headerText = 'DRAFT'; // Or empty strings
    } else {
        headerText = `FROM: ${originatorName}`;
    }

    // Snippet Logic (fade after 20 chars)
    const snippet = body ? (body.length > 20 ? body.substring(0, 20) : body) : 'No content';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-ink last:border-b-0 p-6 hover:bg-ink/5 cursor-pointer group relative transition-colors"
        >
            {/* Unread Indicator Bar */}
            {isUnread && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-klein" />
            )}

            <div className="flex flex-col space-y-2">
                {/* Metadata Header */}
                <div className="flex justify-between items-baseline text-xs font-mono text-ink/60 uppercase tracking-wider">
                    <span className="group-hover:text-klein transition-colors">
                        {headerText}
                    </span>
                    {activeTab !== 'draft' && (
                        <span>
                            CHAIN: {chainCount}
                        </span>
                    )}
                </div>

                {/* Subject */}
                <h3 className="text-2xl font-serif text-ink italic leading-tight">
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
        </motion.div>
    );
};

export default LetterPreview;
