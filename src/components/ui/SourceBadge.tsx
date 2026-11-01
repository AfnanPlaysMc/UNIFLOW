import React from 'react';
import { AudioSourceType } from '../../types';

interface SourceBadgeProps {
  source?: AudioSourceType;
  isFullLength?: boolean;
  className?: string;
}

// User requested to remove "Audius Full Track" and badge text for a clean, professional aesthetic
export const SourceBadge: React.FC<SourceBadgeProps> = () => {
  return null;
};
