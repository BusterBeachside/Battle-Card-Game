
import React, { useState, useEffect } from 'react';
import { LogRenderer } from './LogRenderer';
import { generateId } from '../../utils/core';

export const LogEntry: React.FC<{ text: string }> = ({ text }) => {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        // Trigger animation after mount
        const t = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className={`transition-all duration-300 ease-out origin-bottom ${visible ? 'max-h-20 opacity-100 mb-2 transform scale-100' : 'max-h-0 opacity-0 mb-0 transform scale-95'}`}>
             <div className="bg-black/70 border-l-4 border-indigo-500 text-slate-200 text-xs p-2 rounded-r shadow-lg backdrop-blur">
                  <LogRenderer text={text} />
             </div>
        </div>
    );
};
