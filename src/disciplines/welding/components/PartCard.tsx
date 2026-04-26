import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectCard } from './PartMatcherModal';

type Props = {
  project: ProjectCard;
};

const ProjectCardComponent: React.FC<Props> = ({ project }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-sand rounded-xl shadow-lg border-4 border-maineBlue p-4 w-full max-w-md mb-4 relative">
      <img src={project.image} alt={project.title} className="w-full h-48 object-cover rounded mb-2" />
      <h3 className="font-retro text-xl mb-1 text-center">{project.title}</h3>
      <div className="flex flex-wrap gap-1 mb-2">
        {project.healthTags?.map((tag: string) => (
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
          <div className="font-bold">{t('projectCard.materials', { defaultValue: 'Materials' })}</div>
          {project.ingredients.join(', ')}
        </div>
        <div className="text-xs text-gray-600">
          <div className="font-bold">{t('projectCard.equipment', { defaultValue: 'Tools/Equipment' })}</div>
          {project.equipment?.join(', ') || 'None'}
        </div>
        <div className="text-xs text-gray-600">
          <div className="font-bold">Skill Tags</div>
          <div>{project.healthTags?.join(', ') || 'None'}</div>
        </div>
      </div>
      <div className="text-xs text-gray-600">
        <span className="font-bold">{t('projectCard.procedure', { defaultValue: 'Procedure' })}:</span> {project.instructions}
      </div>
    </div>
  );
};

export default ProjectCardComponent;

// Backward-compatible alias
export { ProjectCardComponent as RecipeCardComponent };

