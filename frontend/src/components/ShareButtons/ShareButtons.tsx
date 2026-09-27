import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SharePlatform } from '../../types';
import { FaTwitter, FaFacebook, FaPinterest, FaCopy } from 'react-icons/fa';
import { MdDone } from 'react-icons/md';

interface ShareButtonsProps {
  title: string;
  url: string;
  description?: string;
  image?: string;
}

const platformConfig= {
  twitter: {
    icon: FaTwitter,
    hoverColor: 'hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]',
    label: 'Twitter',
    tooltip: 'Share on Twitter',
  },
  facebook: {
    icon: FaFacebook,
    hoverColor: 'hover:bg-[#4267B2] hover:text-white hover:border-[#4267B2]',
    label: 'Facebook',
    tooltip: 'Share on Facebook',
  },
  pinterest: {
    icon: FaPinterest,
    hoverColor: 'hover:bg-[#E60023] hover:text-white hover:border-[#E60023]',
    label: 'Pinterest',
    tooltip: 'Share on Pinterest',
  },
  copy: {
    icon: FaCopy,
    hoverColor: 'hover:bg-accent hover:text-white hover:border-accent',
    label: 'Copy',
    tooltip: 'Copy link',
  },
};

function ShareButtons({ title, url, description, image }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState<SharePlatform | null>(null);

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
      setActivePlatform(platform);
      setTimeout(() => {
        setActivePlatform(null);
        setTimeout(() => setCopied(false), 300);
      }, 1000);
    } else {
      const link = shareLinks[platform];
      if (link) {
        window.open(link, '_blank', 'width=600, height=400');
      }
    }
  };

  return (
    <div className="relative flex flex-wrap items-center gap-2 sm:gap-4">
      <span className="text-sm text-secondary cursor-default">Share this recipe:</span>

      <div className="flex gap-1.5 sm:gap-2">
        {(Object.keys(platformConfig) as SharePlatform[]).map((platform) => {
          const Icon = platformConfig[platform].icon;
          const config = platformConfig[platform];
          const isActive = activePlatform === platform;
          
          return (
            <div key={platform} className="relative">
              <motion.button
                key={platform}
                className={`
                  w-9 h-9 sm:w-10 sm:h-10
                  border rounded-full
                  bg-secondary text-primary
                  cursor-pointer
                  flex items-center justify-center
                  transition-all duration-1000
                  ${config.hoverColor}
                `}
                onClick={() => handleShare(platform)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label={config.label}
                onMouseEnter={() => {
                  setActivePlatform(platform);
                }}
                onMouseLeave={() => {
                  if (!copied || platform !== 'copy') {
                    setActivePlatform(null);
                  }
                }}
              >
                <Icon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              </motion.button>
              
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="
                      absolute bottom-full right-0 mb-2
                      px-3 py-2 z-[1000]
                      bg-secondary text-primary
                      text-xs rounded-xl border
                      whitespace-nowrap
                      shadow-theme
                      after:content-[''] after:absolute after:top-full
                      after:border-4 after:border-t-bg-secondary
                      after:border-x-transparent after:border-b-transparent
                    "
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    {copied ? (
                        <>
                          <MdDone className="inline mr-1 text-green-500" />
                          <span>Link copied!</span>
                        </>
                      ) : (
                        <>
                          <span>{config.tooltip}</span>
                        </>
                      )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default ShareButtons;