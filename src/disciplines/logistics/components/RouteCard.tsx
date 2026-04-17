import React from 'react';
import { useTranslation } from 'react-i18next';
import { RouteCard } from './RouteMatcherModal';

type Props = {
  route: RouteCard;
};

const RouteCardComponent: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-sand rounded-xl shadow-lg border-4 border-maineBlue p-4 w-full max-w-md mb-4 relative">
      <img src={route.image} alt={route.title} className="w-full h-48 object-cover rounded mb-2" />
      <h3 className="font-retro text-xl mb-1 text-center">{route.title}</h3>
      <div className="flex flex-wrap gap-1 mb-2">
        {route.healthTags?.map((tag: string) => (
          <span 
            key={tag}
            className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-600"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="text-xs text-gray-600">
          <div className="font-bold">{t('recipeCard.ingredients', { defaultValue: 'Materials' })}</div>
          {route.items.join(', ')}
        </div>
        <div className="text-xs text-gray-600">
          <div className="font-bold">{t('recipeCard.equipment', { defaultValue: 'Tools/Equipment' })}</div>
          {route.equipment?.join(', ') || 'None'}
        </div>
        <div className="text-xs text-gray-600">
          <div className="font-bold">{t('recipeCard.nutrition', { defaultValue: 'Specifications' })}</div>
          <div>{t('recipeCard.carbs', { defaultValue: 'Complexity' })}: {route.nutrition?.carbs}g</div>
          <div>{t('recipeCard.protein', { defaultValue: 'Quality' })}: {route.nutrition?.protein}g</div>
          <div>{t('recipeCard.fat', { defaultValue: 'Risk' })}: {route.nutrition?.saturatedFat}g</div>
        </div>
      </div>
      <div className="text-xs text-gray-600">
        <span className="font-bold">{t('recipeCard.instructions', { defaultValue: 'Procedure' })}:</span> {route.instructions}
      </div>
    </div>
  );
};

export default RouteCardComponent;

