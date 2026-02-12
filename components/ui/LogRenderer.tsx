import React from 'react';

export const LogRenderer: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(\[.*?\])/g);
    return (
        <span>
            {parts.map((part, i) => {
                if (part.startsWith('[') && part.endsWith(']')) {
                    const content = part.slice(1, -1);
                    const isRed = content.includes('♥') || content.includes('♦') || content.includes('Red');
                    return (
                        <span key={i} className={`font-bold ${isRed ? 'text-red-400' : 'text-slate-300'}`}>
                            {content}
                        </span>
                    );
                }
                return part;
            })}
        </span>
    );
};