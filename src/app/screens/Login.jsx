import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardContext } from '../App';

export default function Login() {
  const { setIsDashboard } = useContext(DashboardContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  useEffect(() => {
    setIsDashboard(true);
    return () => {
      setIsDashboard(false);
    };
  }, []);
  const handleSubmit = () => {
    console.log(email, password);
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
        }}
      >
        <form
          onSubmit={handleSubmit}
          className="contact__section__right"
          style={{ maxWidth: 500, padding: 20 }}
        >
          <Link
            to="/"
            onClick={() => {
              document.getElementById('home').checked = true;
            }}
            className="header__wrapper__logo"
            style={{ marginLeft: 'auto', marginRight: 'auto', fontSize: 35 }}
          >
            <span style={{ fontSize: 50 }}>M</span>
            <div>ehfooz-ur-rehman</div>
          </Link>
          <div
            className="contact__section__right__label"
            style={{ fontSize: 30, fontWeight: 'bold' }}
          >
            Login
          </div>
          <div className="contact__section__right__label">Email Address</div>
          <input
            type="text"
            placeholder="Email Address"
            className="contact__section__right__input__box"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            required
          />
          <div className="contact__section__right__label">Password</div>
          <input
            type="text"
            placeholder="Password"
            className="contact__section__right__input__box"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            required
          />

          <button
            title="Send"
            className="contact__section__right__btn"
            style={{
              marginLeft: 'auto',
              marginRight: 'auto',
              width: '100%',
              marginTop: 40,
            }}
          >
            Login
          </button>
        </form>
      </div>
    </>
  );
}
