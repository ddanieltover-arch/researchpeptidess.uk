import React from 'react';
import { GeoQuickAnswerContext, getGeoQuickAnswerText } from '../../lib/geo-quick-answers';
import { GeoQuickAnswer } from './GeoQuickAnswer';

interface GeoQuickAnswerFromPathProps {
  path: string;
  context?: GeoQuickAnswerContext;
  className?: string;
}

export const GeoQuickAnswerFromPath: React.FC<GeoQuickAnswerFromPathProps> = ({
  path,
  context,
  className,
}) => {
  const text = getGeoQuickAnswerText(path, context);
  if (!text) return null;
  return <GeoQuickAnswer text={text} className={className} />;
};
