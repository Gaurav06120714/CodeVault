import React from 'react';
import { PLATFORMS } from '../constants/platforms';
import styles from './PlatformChip.module.css';

interface PlatformChipProps {
  platformId: string;
  size?: 'sm' | 'md' | 'lg'; // sm: 16px, md: 24px, lg: 30px
  variant?: 'default' | 'dark' | 'ghost';
  showName?: boolean;
  href?: string;
  className?: string;
}

export function PlatformChip({ 
  platformId, 
  size = 'md', 
  variant = 'default',
  showName = true,
  href,
  className = ''
}: PlatformChipProps) {
  const platform = PLATFORMS[platformId];
  if (!platform) return null;

  const iconClasses = `${styles.icon} ${styles[`icon-${size}`]} ${platform.iconClass}`;
  
  const content = (
    <>
      <span 
        className={iconClasses}
        role="img"
        aria-label={`${platform.name} Logo`}
      >
        {platform.shortName}
      </span>
      {showName && platform.name}
    </>
  );

  const chipClasses = `${styles.chip} ${styles[variant]} ${styles[`size-${size}`]} ${className}`.trim();

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={chipClasses}>
        {content}
      </a>
    );
  }

  return (
    <span className={chipClasses}>
      {content}
    </span>
  );
}
