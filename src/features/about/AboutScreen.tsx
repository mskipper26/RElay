import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import aboutContent from '../../AboutContent.md?raw';

export const AboutScreen = ({ onClose }: { onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-parchment z-50 flex flex-col p-8 font-mono text-ink overflow-y-auto">
            <header className="flex justify-between items-center border-b border-ink pb-4 mb-8 sticky top-0 bg-parchment z-10">
                <div className="text-xl font-serif italic tracking-widest">About</div>
                <button onClick={onClose} className="text-xs hover:text-ink/60 underline">CLOSE</button>
            </header>

            <div className="max-w-3xl mx-auto w-full markdown-body font-serif text-lg leading-relaxed pb-20">
                <ReactMarkdown
                    components={{
                        h1: ({ node, ...props }: any) => <h1 className="text-3xl font-bold uppercase tracking-widest mb-6 mt-8 pb-2 border-b border-ink/20" {...props} />,
                        h2: ({ node, ...props }: any) => <h2 className="text-xl font-bold uppercase tracking-widest mb-4 mt-8 text-klein" {...props} />,
                        h3: ({ node, ...props }: any) => <h3 className="text-lg font-bold uppercase tracking-widest mb-3 mt-6" {...props} />,
                        p: ({ node, ...props }: any) => <p className="mb-6 opacity-90" {...props} />,
                        ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 mb-6 space-y-2" {...props} />,
                        li: ({ node, ...props }: any) => <li className="pl-2" {...props} />,
                        blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-klein pl-4 italic my-6 bg-ink/5 p-4" {...props} />,
                        code: ({ node, ...props }: any) => <code className="bg-ink/10 font-mono text-sm px-1 py-0.5 rounded text-klein" {...props} />
                    }}
                >
                    {aboutContent}
                </ReactMarkdown>
            </div>
        </div>
    );
};
