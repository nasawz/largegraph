import LargeGraph from './largegraph';
import * as React from 'react';
import { hot } from 'react-hot-loader';

export interface IAppProps {
}

function App (props: IAppProps) {
  return (
      <LargeGraph />
  );
}
export default hot(module)(App)