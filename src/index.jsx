import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyABkFBRoX5c1eu8NcQRlM4HrMCMpIf_Kwk",
  authDomain: "mehfooz-ur-rehman.firebaseapp.com",
  databaseURL: "https://mehfooz-ur-rehman.firebaseio.com",
  projectId: "mehfooz-ur-rehman",
  storageBucket: "mehfooz-ur-rehman.appspot.com",
  messagingSenderId: "49836239081",
  appId: "1:49836239081:web:e21991b6ba1c751f492878",
  measurementId: "G-S9SYWJQ9RE",
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

logEvent(analytics, "user visited");

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
