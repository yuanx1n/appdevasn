import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(outputs);
//deploy backend first i guess
// Amplify.configure({
//   ...Amplify.getConfig(),
//   Predictions: outputs.custom.Predictions,
// });

ReactDOM.createRoot(document.getElementById("root")!).render(
   
  <React.StrictMode>
    <Authenticator>
      <App />
    </Authenticator>
  </React.StrictMode>
);
