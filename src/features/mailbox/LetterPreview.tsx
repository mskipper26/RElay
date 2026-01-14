import React from 'react';
import { motion } from 'framer-motion';

const LetterPreview = ({ letter }) => {
    const subject = letter.get('subject') || 'NO SUBJECT';
    const originator = letter.get('originator');
    const originatorName = originator ? originator.get('username') : 'UNKNOWN';
    const chainCount = letter.get('chainCount') || 0;

    // Fake "Unread" logic for now (could be based on local storage or 'readBy' array)
    // For aesthetic matching the prompt: "Use International Klein Blue (#002FA7) for the 'Unread' indicator."
    const isUnread = true;

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
                        FROM: {originatorName}
                    </span>
                    <span>
                        CHAIN: {chainCount}
                    </span>
                </div>

                {/* Subject */}
                <h3 className="text-2xl font-serif text-ink italic leading-tight">
                    {subject}
                </h3>

                {/* Footer / ID */}
                <div className="pt-2 text-[10px] font-mono opacity-30">
                    ID: {letter.id}
                </div>
            </div>
        </motion.div>
    );
};

export default LetterPreview;
