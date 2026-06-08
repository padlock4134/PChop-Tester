import React from 'react';
import GenericFirstPersonARScene, { GenericFirstPersonARSceneProps } from '../../../components/ar/GenericFirstPersonARScene';

const ElectricalARScene: React.FC<GenericFirstPersonARSceneProps> = (props) => (
  <GenericFirstPersonARScene {...props} discipline={props.discipline || 'electrical'} />
);

export default ElectricalARScene;
