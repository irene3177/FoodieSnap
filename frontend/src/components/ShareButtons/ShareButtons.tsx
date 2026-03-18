import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SharePlatform } from '../../types';
import './ShareButtons.css';

interface ShareButtonsProps {
  title: string;
  url: string;
  description?: string;
  image?: string;
}

function ShareButtons({ title, url, description, image }: ShareButtonsProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = `${window.location.origin}${url}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || title);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    pinterest: image 
      ? `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodeURIComponent(image)}&description=${encodedDescription}`
      : null,
    copy: fullUrl
  };

  const handleShare = (platform: SharePlatform) => {
    if (platform === 'copy') {
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setShowTooltip(true);
      setTimeout(() => {
        setShowTooltip(false);
        setTimeout(() => setCopied(false), 300);
      }, 2000);
    } else {
      const link = shareLinks[platform];
      if (link) {
        window.open(link, '_blank', 'width=600, height=400');
      }
    }
  };

  return (
    <div className="share-buttons">
      <span className="share-buttons__label">Share this recipe:</span>

      <div className="share-buttons__container">
        <motion.button
          className="share-buttons__button share-button__button--twiter"
          onClick={() => handleShare('twitter')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Share on Twitter"
        >
          <svg viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.104c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0021.447-4.866c.24-.586.433-1.19.575-1.809a9.973 9.973 0 002.461-2.548 10.022 10.022 0 01-2.824.779z" />
          </svg>
        </motion.button>

        <motion.button
          className="share-buttons__button share-button__button--facebook"
          onClick={() => handleShare('facebook')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Share on Facebook"
        >
          <svg viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </motion.button>

        <motion.button
          className="share-buttons__button share-buttons__button--pinterest"
          onClick={() => handleShare('pinterest')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Share on Pinterest"
        >
          <svg viewBox="0 0 24 24">
              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.175.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.748 2.853c-.27 1.041-1.009 2.348-1.503 3.146 1.123.345 2.311.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
            </svg>
        </motion.button>

        <motion.button
          className="share-buttons__button share-button__button--copy"
          onClick={() => handleShare('copy')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Copy link"
        >
          <svg viewBox="0 0 24 24">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
        </motion.button>
      </div>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="share-buttons__tooltip"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {copied ? '✅ Link copied!' : '📋 Click to copy'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ShareButtons;