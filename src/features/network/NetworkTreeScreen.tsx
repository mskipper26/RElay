
import React, { useState, useEffect } from 'react';
import Parse from '../../services/parseClient';
import { motion } from 'framer-motion';

interface NetworkNode {
    id: string;
    username: string;
    profilePicture?: string;
    children: NetworkNode[];
}

const TreeNode = ({ node, isRoot = false }: { node: NetworkNode; isRoot?: boolean }) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setExpanded(!expanded)}
                className={`flex flex-col items-center cursor-pointer hover:bg-ink/5 p-2 rounded-lg transition-colors z-10 relative ${isRoot ? 'mb-8' : 'mb-4'}`}
            >
                {/* Profile Picture */}
                <div
                    className={`rounded-full border-2 overflow-hidden bg-parchment ${isRoot ? 'w-20 h-20 border-klein' : 'w-12 h-12 border-ink/20'}`}
                >
                    {node.profilePicture ? (
                        <img src={node.profilePicture} alt={node.username} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-paper text-ink/20 font-mono text-xs">
                            {node.username.slice(0, 2).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Username */}
                <span className={`font-mono mt-2 bg-parchment px-2 rounded border border-transparent ${isRoot ? 'text-lg font-bold text-klein' : 'text-xs text-ink/70'}`}>
                    {node.username}
                </span>

                {/* Collapse/Expand Indicator */}
                {node.children.length > 0 && (
                    <div className="text-[10px] text-ink/30 mt-1">
                        {expanded ? '▲' : `▼ (${node.children.length})`}
                    </div>
                )}
            </motion.div>

            {/* Children and Connectors */}
            {expanded && node.children.length > 0 && (
                <div className="flex relative pt-4">
                    {/* Horizontal Connector Line for siblings */}
                    {node.children.length > 1 && (
                        <div className="absolute top-0 left-0 right-0 h-px bg-ink/10 -translate-y-1/2 w-[calc(100%-4rem)] mx-auto" />
                    )}

                    {node.children.map((child, index) => (
                        <div key={child.id} className="flex flex-col items-center px-4 relative">
                            {/* Vertical Line from Parent to Child */}
                            <div className="absolute top-[-1rem] left-1/2 w-px h-4 bg-ink/10 -translate-x-1/2" />

                            <TreeNode node={child} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const NetworkTreeScreen = ({ onClose }: { onClose: () => void }) => {
    const [tree, setTree] = useState<NetworkNode | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadTree = async () => {
            try {
                const result = await Parse.Cloud.run('getReferralTree');
                setTree(result);
            } catch (err) {
                console.error("Failed to load network tree", err);
                setError("Could not load network.");
            } finally {
                setLoading(false);
            }
        };
        loadTree();
    }, []);

    return (
        <div className="fixed inset-0 bg-parchment z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-ink/10 flex items-center justify-between px-6 bg-parchment/80 backdrop-blur-md">
                <h1 className="text-xl font-serif text-ink italic">Referral Lineage</h1>
                <button onClick={onClose} className="text-ink/50 hover:text-red-500 font-mono text-sm transition-colors">
                    [CLOSE]
                </button>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto p-12 flex justify-center items-start">
                {loading && (
                    <div className="text-ink/40 font-mono animate-pulse">Tracing lineage...</div>
                )}

                {error && (
                    <div className="text-red-500 font-mono text-sm">{error}</div>
                )}

                {tree && (
                    <div className="min-w-max">
                        <TreeNode node={tree} isRoot={true} />
                    </div>
                )}
            </div>

            {/* Legend / Footer */}
            <div className="h-12 border-t border-ink/5 flex items-center px-6 text-[10px] font-mono text-ink/30 justify-between">
                <span>Root: You</span>
                <span>Branches: Your Referrals</span>
            </div>
        </div>
    );
};

export default NetworkTreeScreen;
