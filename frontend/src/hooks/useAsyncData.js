import React from "react";

const INITIAL_STATE = {
  data: null,
  error: null,
  isLoading: true,
};

export function useAsyncData(factory, deps) {
  const [state, setState] = React.useState(INITIAL_STATE);

  React.useEffect(() => {
    let isCancelled = false;

    setState(INITIAL_STATE);

    factory()
      .then((data) => {
        if (isCancelled) return;
        setState({
          data,
          error: null,
          isLoading: false,
        });
      })
      .catch((error) => {
        if (isCancelled) return;
        setState({
          data: null,
          error,
          isLoading: false,
        });
      });

    return () => {
      isCancelled = true;
    };
  }, deps);

  return state;
}
