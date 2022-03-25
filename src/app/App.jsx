import React, { useState, createContext } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Contact, Home, Portfolio, ProjectDetails } from './screens';
import { ContactSection, Footer, Header } from './components';
import { CloudinaryContext } from 'cloudinary-react';
import info from './assets/info.json';
import TestimonialFormSection from './components/TestimonialFormSection';
import Login from './screens/Login';
import './App.scss';
import Dashboard from './screens/Dashboard';

function Routing({ info }) {
  return (
    <Routes>
      <Route path="/">
        <Route path="" element={<Home info={info} />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="project-detail" element={<ProjectDetails />} />
        <Route path="contact" element={<Contact />} />
        <Route path="write-testimonial" element={<TestimonialFormSection />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export const AuthContext = createContext();
export const DashboardContext = createContext();

export default function App() {
  const [isUser, setIsUser] = useState(false);
  const [isDashboard, setIsDashboard] = useState(false);

  return (
    <CloudinaryContext cloudName="mehfoozurrehman">
      <AuthContext.Provider value={{ isUser, setIsUser }}>
        <DashboardContext.Provider value={{ isDashboard, setIsDashboard }}>
          {isDashboard ? null : <Header info={info} />}
          <Routing info={info} />
          {isDashboard ? null : (
            <>
              <ContactSection />
              <Footer />
            </>
          )}
        </DashboardContext.Provider>
      </AuthContext.Provider>
    </CloudinaryContext>
  );
}
