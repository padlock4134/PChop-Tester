import React from 'react';
import GenericFirstPersonARScene, { GenericFirstPersonARSceneProps } from '../../../components/ar/GenericFirstPersonARScene';

const ConstructionARScene: React.FC<GenericFirstPersonARSceneProps> = (props) => (
  <GenericFirstPersonARScene {...props} discipline={props.discipline || 'construction'} />
);

export default ConstructionARScene;
