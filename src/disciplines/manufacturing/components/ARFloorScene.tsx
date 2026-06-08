import React from 'react';
import GenericFirstPersonARScene, { GenericFirstPersonARSceneProps } from '../../../components/ar/GenericFirstPersonARScene';

const ManufacturingARScene: React.FC<GenericFirstPersonARSceneProps> = (props) => (
  <GenericFirstPersonARScene {...props} discipline={props.discipline || 'manufacturing'} />
);

export default ManufacturingARScene;
