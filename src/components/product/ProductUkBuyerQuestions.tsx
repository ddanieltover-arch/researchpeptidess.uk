import React from 'react';
import { Product } from '../../types';
import { UK_BUYER_SECTION_HEADING, getUkBuyerQuestionsForProduct } from '../../lib/uk-buyer-seo';
import { UkBuyerQuestionsPanel } from '../content/UkBuyerQuestionsPanel';

interface ProductUkBuyerQuestionsProps {
  product: Product;
}

export const ProductUkBuyerQuestions: React.FC<ProductUkBuyerQuestionsProps> = ({ product }) => {
  const topics = getUkBuyerQuestionsForProduct(product).map((item) => ({
    question: item.question,
    answer: item.answer,
  }));

  return (
    <UkBuyerQuestionsPanel
      id="uk-ordering-questions"
      eyebrow="Product page"
      title={UK_BUYER_SECTION_HEADING}
      intro={`Common buyer questions for ${product.name} — United Kingdom catalogue, in-vitro research supply only.`}
      topics={topics}
      variant="light"
    />
  );
};
