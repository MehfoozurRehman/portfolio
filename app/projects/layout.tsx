import Footer from "@/components/Footer";
import Header from "@/components/header/Header";

export default function ProjectsLayout({ children }: any) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
