import { createContext, useState } from 'react';

const InferenceStateContext = createContext({
  state: 'PENDING',
  changeState: () => {},
});

const InferenceStateProvider = ({ children }) => {
  const [state, setState] = useState('PENDING');

  const changeState = (newState) => {
    setState(newState);
  };

  return (
    <InferenceStateContext.Provider
      value={{
        state,
        changeState,
      }}
    >
      {children}
    </InferenceStateContext.Provider>
  );
};

export { InferenceStateContext, InferenceStateProvider };
