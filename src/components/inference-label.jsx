import { useContext } from 'react';
import { InferenceStateContext } from '../context/InferenceState';

const InferenceLabel = (props) => {
  return <div>{props.value}</div>;
};

export default InferenceLabel;
