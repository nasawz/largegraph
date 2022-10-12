// if ((module as any).hot) {
//   (module as any).hot.accept();
// }
// console.log("hello largegraph");

import React from 'react';
import ReactDOM, { createRoot } from 'react-dom/client';
import './index.css';
import App from './app';


const rootElement:any = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
    <App />,
);