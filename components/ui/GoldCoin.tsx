import React from 'react';

interface GoldCoinProps {
    className?: string;
    size?: number;
}

export const GoldCoin: React.FC<GoldCoinProps> = ({ className = '', size = 16 }) => {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className={`inline-block select-none align-middle ${className}`}
        >
            <defs>
                <radialGradient id="goldGradient" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#FFE066" />
                    <stop offset="40%" stopColor="#F5B041" />
                    <stop offset="100%" stopColor="#B37D14" />
                </radialGradient>
                <linearGradient id="shineGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                    <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Outer Rim */}
            <circle cx="12" cy="12" r="11" fill="url(#goldGradient)" stroke="#8C620D" strokeWidth="1" />
            {/* Inner Ring */}
            <circle cx="12" cy="12" r="8" stroke="#FCE082" strokeWidth="1" opacity="0.8" strokeDasharray="2,1" />
            {/* Star symbol inside gold coin */}
            <path 
                d="M12 7.5L13.8 11.2L17.8 11.5L14.8 14.1L15.7 18.1L12 16L8.3 18.1L9.2 14.1L6.2 11.5L10.2 11.2L12 7.5Z" 
                fill="#FFF099" 
                stroke="#704D07" 
                strokeWidth="0.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Surface Shine Highlight overlay */}
            <circle cx="12" cy="12" r="10.5" fill="url(#shineGradient)" pointerEvents="none" />
        </svg>
    );
};
