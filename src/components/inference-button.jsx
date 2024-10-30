import { useContext } from 'react';
import { InferenceStateContext } from '../context/InferenceState';

const ChangeButton = () => {
  const { state, changeState } = useContext(InferenceStateContext);

  const handleClick = () => {
    state === 'PENDING' ? changeState('FOUND') : changeState('PENDING');
  };

  return <button onClick={handleClick}>Click me</button>;
};

export default ChangeButton;
