import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './CardBack.module.css';

export interface CardEntry {
  pageURL: string;
  image: string;
  imageLight?: string;
}

export interface CardBackProps {
  colorMode: 'light' | 'dark';
  entries: readonly CardEntry[];
}

// Reason: Extract topic name from pageURL for display
// Example: '/cs/pl/rust/basic/' -> 'Rust', '/web/svg/' -> 'SVG'
const extractTopicName = (pageURL: string): string => {
  if (pageURL === '#') return '';
  const parts = pageURL.split('/').filter(Boolean);
  if (parts.length === 0) return '';

  // Get the last non-empty segment
  const lastPart = parts[parts.length - 1];
  // Capitalize first letter
  return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
};

// Reason: Extract icon identifier from image path for fallback display
// Example: '/assets/cards/rust.png' -> 'Rust'
const extractIconName = (imagePath: string): string => {
  const fileName = imagePath.split('/').pop()?.replace(/\.(png|jpg|jpeg|webp)$/, '') || '';
  return fileName.charAt(0).toUpperCase() + fileName.slice(1);
};

const CardBack: React.FC<CardBackProps> = ({ colorMode, entries }) => {
  // Filter out placeholder entries (pageURL: '#')
  const validEntries = entries.filter(entry => entry.pageURL !== '#');

  return (
    <div className={styles.cardBack}>
      <div className={styles.header}>
        <h2 className={styles.title}>Explore Topics</h2>
        <p className={styles.subtitle}>Knowledge Base</p>
      </div>

      <div className={styles.grid}>
        {validEntries.slice(0, 9).map((entry, index) => {
          const imagePath = colorMode === 'light' && entry.imageLight
            ? entry.imageLight
            : entry.image;
          const resolvedImage = useBaseUrl(imagePath);
          const resolvedLink = useBaseUrl(entry.pageURL);
          const topicName = extractTopicName(entry.pageURL) || extractIconName(entry.image);

          return (
            <a
              key={index}
              href={resolvedLink}
              className={styles.gridItem}
              aria-label={`View ${topicName} content`}
            >
              <div className={styles.iconWrapper}>
                <img
                  src={resolvedImage}
                  alt={topicName}
                  className={styles.icon}
                  loading="lazy"
                />
              </div>
              <span className={styles.label}>{topicName}</span>
            </a>
          );
        })}
      </div>

      <div className={styles.footer}>
        <span className={styles.badge}>Interactive Card System</span>
      </div>
    </div>
  );
};

export default CardBack;
