import React from 'react';
import { HOME_UK_BUYER_TOPICS } from '../../lib/uk-buyer-seo';
import { UkBuyerQuestionsPanel } from '../content/UkBuyerQuestionsPanel';

export const HomeUkBuyerQuestions: React.FC = () => {
  return (
    <UkBuyerQuestionsPanel
      variant="home"
      title="How to buy, where to order, and UK pricing"
      intro="Researchers often search for how to buy peptides in the United Kingdom, where UK delivery applies, and current GBP prices. These answers point to the live catalogue and policies — in-vitro laboratory use only."
      topics={HOME_UK_BUYER_TOPICS}
    />
  );
};
