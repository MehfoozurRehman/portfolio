import React, { useState } from "react";
import { MessageCircle, Send, X } from "react-feather";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const scrollToBottom = (id) => {
    const element = document.getElementById(id);
    element.scrollTop = element.scrollHeight;
  };
  function handleSubmit(e) {
    e.preventDefault();
    scrollToBottom("chatbot__wrapper__panel__chat");
  }
  return (
    <>
      <div className="chatbot__wrapper">
        {isOpen ? (
          <div className="chatbot__wrapper__panel">
            <div className="chatbot__wrapper__panel__header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                <path
                  fill-opacity="1"
                  d="M0,64L48,106.7C96,149,192,235,288,256C384,277,480,235,576,213.3C672,192,768,192,864,192C960,192,1056,192,1152,202.7C1248,213,1344,235,1392,245.3L1440,256L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
                ></path>
              </svg>
              <div className="chatbot__wrapper__panel__header__content">
                <div className="chatbot__wrapper__panel__header__content__left">
                  <div className="chatbot__wrapper__panel__header__content__status"></div>
                  <div className="chatbot__wrapper__panel__header__content__title">
                    online bot
                  </div>
                </div>
                <button
                  className="chatbot__wrapper__panel__header__close"
                  onClick={() => {
                    setIsOpen(!isOpen);
                  }}
                >
                  <X size={20} color="currentColor" />
                </button>
              </div>
            </div>
            <div
              className="chatbot__wrapper__panel__chat"
              id="chatbot__wrapper__panel__chat"
              onLoad={() => {
                scrollToBottom("chatbot__wrapper__panel__chat");
              }}
            >
              <ChatBotMessage
                bot
                user="user"
                message="Lorem, ipsum dolor sit amet consectetur adipisicing elit. Libero
        adipisci ea aperiam culpa, pariatur nesciunt, alias vero facilis ut,
        repellendus fuga cupiditate saepe mollitia. Eos voluptatem quae quasi
        accusamus iure!"
              />
              <ChatBotMessage
                user="user"
                message="Lorem, ipsum dolor sit amet consectetur adipisicing elit. Libero
        adipisci ea aperiam culpa, pariatur nesciunt, alias vero facilis ut,
        repellendus fuga cupiditate saepe mollitia. Eos voluptatem quae quasi
        accusamus iure!"
              />
              <ChatBotMessage
                bot
                user="user"
                message="Lorem, ipsum dolor sit amet"
              />
              <ChatBotMessage
                user="user"
                message="Lorem, ipsum dolor sit amet"
              />
            </div>
            <form
              onSubmit={handleSubmit}
              className="chatbot__wrapper__panel__form"
            >
              <input
                type="text"
                placeholder="Type a message"
                autoFocus
                className="chatbot__wrapper__panel__form__input"
              />
              <button className="chatbot__wrapper__panel__form__button">
                <Send size={20} color="currentColor" />
              </button>
            </form>
          </div>
        ) : null}
        <button
          className="chatbot__wrapper__button"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        >
          {isOpen ? (
            <X size={30} color="currentColor" />
          ) : (
            <MessageCircle size={30} color="currentColor" />
          )}
        </button>
      </div>
      <ChatBotStyles />
    </>
  );
}

function ChatBotMessage({ bot, user, message }) {
  return (
    <div
      className={
        bot
          ? "chatbot__wrapper__panel__chat__message"
          : "chatbot__wrapper__panel__chat__message chatbot__wrapper__panel__chat__message__right"
      }
    >
      {bot ? (
        <img
          src="https://media.istockphoto.com/photos/deep-learning-artificial-intelligence-background-picture-id1310293181?s=612x612"
          alt="bot"
          className="chatbot__wrapper__panel__chat__message__avatar"
        />
      ) : (
        <div className="chatbot__wrapper__panel__chat__message__title">
          {user}
        </div>
      )}
      <div className="chatbot__wrapper__panel__chat__message__content">
        {message}
      </div>
    </div>
  );
}

function ChatBotStyles({}) {
  return (
    <style jsx>
      {`
        .chatbot__wrapper {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .chatbot__wrapper__button {
          border: none;
          border-radius: 50px;
          width: 50px;
          height: 50px;
          padding: 0em;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #df3c3c;
          color: white;
          cursor: pointer;
          box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.3);
        }
        .chatbot__wrapper__panel__header {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          height: 100px;
          width: 100%;
        }
        .chatbot__wrapper__panel__header svg {
          fill: #df3c3c;
          width: 135%;
          margin-left: -20px;
          border-top-left-radius: 10px;
          border-top-right-radius: 10px;
        }
        .chatbot__wrapper__panel__header__content {
          position: absolute;
          top: 0px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 0.5em 0.8em;
          background-color: rgba(0, 0, 0, 0.1);
        }
        .chatbot__wrapper__panel__header__content__left {
          display: flex;
          align-items: center;
        }
        .chatbot__wrapper__panel__header__content__status {
          width: 10px;
          height: 10px;
          background-color: #00d600;
          margin-right: 0.5em;
          border-radius: 50px;
        }
        .chatbot__wrapper__panel__header__content__title {
          color: white;
        }
        .chatbot__wrapper__panel__header__close {
          padding: 0em;
          width: 12px;
          height: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: transparent;
          color: white;
          border: none;
          cursor: pointer;
          margin-right: -10px;
        }
        .chatbot__wrapper__panel {
          background-color: white;
          width: 100%;
          max-width: 380px;
          margin-bottom: 1em;
          border-radius: 10px;
        }
        .chatbot__wrapper__panel__chat {
          padding: 0em 0.8em;
          display: flex;
          flex-direction: column;
          height: 350px;
          overflow: auto;
        }
        .chatbot__wrapper__panel__chat::-webkit-scrollbar {
          width: 5px;
        }
        .chatbot__wrapper__panel__chat::-webkit-scrollbar-thumb {
          background-color: #df3c3c;
          border-radius: 50px;
        }
        .chatbot__wrapper__panel__chat__message {
          display: flex;
          flex-direction: column;
          margin-bottom: 0.5em;
        }
        .chatbot__wrapper__panel__chat__message__right {
          align-items: flex-end;
        }
        .chatbot__wrapper__panel__chat__message__avatar {
          width: 35px;
          height: 35px;
          min-width: 35px;
          min-height: 35px;
          border-radius: 50px;
          margin-bottom: 0.5em;
        }
        .chatbot__wrapper__panel__chat__message__title {
          font-size: 15px;
        }
        .chatbot__wrapper__panel__chat__message__content {
          background-color: #df3c3c;
          border-radius: 20px;
          padding: 1em 1.2em;
          border-top-left-radius: 0px;
          font-size: 13px;
          font-weight: 300;
          color: white;
          width: fit-content;
          box-shadow: 0px 10px 20px rgba(0, 0, 0, 0.05);
          max-width: 90%;
        }
        .chatbot__wrapper__panel__chat__message__right
          .chatbot__wrapper__panel__chat__message__content {
          border-radius: 20px;
          border-top-right-radius: 0px;
          background-color: #0e1630;
        }
        .chatbot__wrapper__panel__form {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.8em;
        }
        .chatbot__wrapper__panel__form__input {
          flex: 1;
          height: 40px;
          padding: 0em 1em;
          border-radius: 5px;
          border: 1px solid #df3c3c;
          outline: none;
          margin-right: 0.5em;
        }
        .chatbot__wrapper__panel__form__input:focus {
          border-width: 2px;
        }
        .chatbot__wrapper__panel__form__button {
          height: 40px;
          width: 40px;
          background-color: #df3c3c;
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0em;
          border-radius: 5px;
          cursor: pointer;
        }
        .chatbot__wrapper__panel__form__button:hover {
          transition: 300ms ease-in-out;
          background-color: #d64343;
        }
        @media (max-width: 500px) {
          .chatbot__wrapper {
            right: 0px;
            bottom: 0px;
            padding: 1em;
          }
        }
      `}
    </style>
  );
}
