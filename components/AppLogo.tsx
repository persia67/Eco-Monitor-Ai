import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = '', size = 48, animated = true }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-slate-700 dark:text-slate-300 transition-colors duration-300"
      >
        {/* Background Subtle Shading or Container (optional, keep it clean and empty per style guidelines) */}

        {/* --- 1. Industrial Chimney (Left) --- */}
        {/* Main Chimney Body (Trapezoid-shaped stack) */}
        <path
          d="M185 220 L265 220 L290 400 L160 400 Z"
          stroke="currentColor"
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.08"
        />
        {/* Top Rim Collar */}
        <rect
          x="180"
          y="205"
          width="90"
          height="16"
          rx="8"
          fill="currentColor"
        />
        {/* Bottom Base Collar */}
        <rect
          x="130"
          y="400"
          width="190"
          height="54"
          rx="12"
          stroke="currentColor"
          strokeWidth="24"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.15"
        />
        {/* Decorative Horizontal Stack Band (Divide-style) */}
        <line
          x1="180"
          y1="290"
          x2="270"
          y2="290"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* --- 2. Emissions / Smoke Cloud (Top Center-Left) --- */}
        <g className={animated ? "animate-[bounce_3s_infinite_ease-in-out]" : ""}>
          {/* Main puffy cloud billowing from stack */}
          <path
            d="M 225 190 
               C 180 170, 160 110, 210 80 
               C 210 50,  270 40,  300 70 
               C 330 50,  380 70,  370 110 
               C 390 130, 390 170, 350 180
               C 350 195, 290 200, 275 185
               Z"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* --- 3. IoT / Wireless Waves (Top Right) --- */}
        <g className="text-emerald-500 dark:text-emerald-400">
          {/* Signal Source Node */}
          <circle
            cx="380"
            cy="235"
            r="18"
            fill="currentColor"
            className={animated ? "animate-pulse" : ""}
          />
          {/* Inner Signal Wave Arc */}
          <path
            d="M 415 200 A 50 50 0 0 1 415 270"
            stroke="currentColor"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
          />
          {/* Outer Signal Wave Arc */}
          <path
            d="M 445 170 A 90 90 0 0 1 445 300"
            stroke="currentColor"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* --- 4. Smart Circuit Traces / Data Nodes (Bottom Right) --- */}
        <g className="text-sky-500 dark:text-sky-400">
          {/* Line 1: Upper trace */}
          <path
            d="M 290 310 L 390 310 L 390 360"
            stroke="currentColor"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle
            cx="390"
            cy="365"
            r="16"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="4"
          />

          {/* Line 2: Middle trace */}
          <path
            d="M 305 370 L 440 370"
            stroke="currentColor"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
          />
          <circle
            cx="445"
            cy="370"
            r="16"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="4"
          />

          {/* Line 3: Lower trace */}
          <path
            d="M 305 430 L 350 430"
            stroke="currentColor"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
          />
          <circle
            cx="355"
            cy="430"
            r="16"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="4"
          />
        </g>
      </svg>
    </div>
  );
};
