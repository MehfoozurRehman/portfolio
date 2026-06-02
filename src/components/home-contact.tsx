import { Mail, MapPin, Phone, CheckCircle, AlertCircle } from "react-feather";
import { useState } from "react";
import InputBox from "./input-box";
import TextareaBox from "./textarea-box";

type FormStatus = "idle" | "loading" | "success" | "error";

export default function HomeContact() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.subject ||
      !formData.message
    ) {
      setStatus("error");
      setErrorMessage("Please fill in all fields");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch(
        "https://formspree.io/f/xyzabc123",
        {
          method: "POST",
          body: JSON.stringify(formData),
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
        setTimeout(() => setStatus("idle"), 4000);
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to send message. Please try again.",
      );
    }
  };

  return (
    <section
      id="contact__section"
      className="services__section"
      style={{ overflow: "unset" }}
    >
      <div
        className="services__section__header"
        style={{ alignItems: "flex-start" }}
      >
        <div className="home__section__sub__heading">Get in touch</div>
        <div className="home__section__heading">Contact</div>
      </div>
      <div
        className="services__section__content services__section__content__special"
        style={{ alignItems: "flex-start", marginRight: "-2em" }}
      >
        <div className="services__section__content__left">
          <div className="services__section__content__left__entry">
            <div className="services__section__content__left__entry__icon">
              <MapPin size={20} color="currentColor" />
            </div>
            <div className="services__section__content__left__entry__content">
              Samundri, Faisalabad, Punjab, Pakistan
            </div>
          </div>
          <div className="services__section__content__left__entry">
            <div className="services__section__content__left__entry__icon">
              <Phone size={20} color="currentColor" />
            </div>
            <div className="services__section__content__left__entry__content">
              +92 313 7178074
            </div>
          </div>
          <div className="services__section__content__left__entry">
            <div className="services__section__content__left__entry__icon">
              <Mail size={20} color="currentColor" />
            </div>
            <div className="services__section__content__left__entry__content">
              mehfoozijaz786@gmail.com
            </div>
          </div>
        </div>
        <div className="services__section__content__right">
          <form
            className="services__section__content__right__form"
            id="contact__form"
            onSubmit={handleSubmit}
          >
            {status === "success" ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "20px",
                  margin: "3em 0",
                }}
              >
                <CheckCircle size={48} color="#64ffda" />
                <div
                  className="home__section__heading"
                  style={{
                    fontSize: 18,
                    textAlign: "center",
                  }}
                >
                  Thanks for reaching out!
                </div>
                <div style={{ fontSize: 14, color: "#888", textAlign: "center" }}>
                  I'll get back to you as soon as possible.
                </div>
              </div>
            ) : (
              <>
                <div className="home__section__heading">Send me a message</div>

                {status === "error" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px",
                      marginBottom: "16px",
                      background: "rgba(255, 107, 107, 0.1)",
                      border: "1px solid #ff6b6b",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#ff6b6b",
                    }}
                  >
                    <AlertCircle size={18} />
                    {errorMessage}
                  </div>
                )}

                <InputBox
                  placeholder="Your Name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={status === "loading"}
                />
                <InputBox
                  placeholder="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={status === "loading"}
                />
                <InputBox
                  placeholder="Subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  disabled={status === "loading"}
                />
                <TextareaBox
                  placeholder="Your Message"
                  value={formData.message}
                  onChange={handleChange}
                  name="message"
                  disabled={status === "loading"}
                />
                <button
                  className="home__section__button"
                  style={{ width: "100%", marginTop: 20 }}
                  title="send"
                  type="submit"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Sending..." : "Send Message"}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
