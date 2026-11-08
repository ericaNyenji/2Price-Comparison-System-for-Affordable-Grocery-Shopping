//Instead of import React... return (React.createElement('div', null, 'Hello'));...>>>>>>>import {jsx as _jsx} from 'react/jsx-runtime' .....return _jsx('div', {children: 'Hello'});  is automatically injected.........Historically, you had to explicitly import React in every file where you used JSX because the build tools compiles JSX elements into React.createElement() statements under the hood.
//starts the React application and renders it in the browser.
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {createRoot} from 'react-dom/client';
import {StrictMode} from 'react';

//    ./ means “the current folder” (the folder that this file is in).
//    “Import the file named index.css that’s in the same folder as this file.”
//   ../ means “the parent folder” (the folder that contains the current folder).


// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

// reportWebVitals();



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

reportWebVitals();