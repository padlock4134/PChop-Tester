import React from 'react';
import GenericFirstPersonARScene, { GenericFirstPersonARSceneProps } from '../../../components/ar/GenericFirstPersonARScene';

const HvacARScene: React.FC<GenericFirstPersonARSceneProps> = (props) => (
  <GenericFirstPersonARScene {...props} discipline={props.discipline || 'hvac'} />
);

export default HvacARScene;
