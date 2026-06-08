import React from 'react';
import GenericFirstPersonARScene, { GenericFirstPersonARSceneProps } from '../../../components/ar/GenericFirstPersonARScene';

const WeldingARScene: React.FC<GenericFirstPersonARSceneProps> = (props) => (
  <GenericFirstPersonARScene {...props} discipline={props.discipline || 'welding'} />
);

export default WeldingARScene;
