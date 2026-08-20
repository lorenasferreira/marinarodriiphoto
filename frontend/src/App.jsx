import { Routes, Route, useLocation } from "react-router-dom";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import Packages from "./pages/Packages/Packages";
import Category from "./pages/Category/Category";

function App() {
  const location = useLocation();

  const showFooter = location.pathname !== "/";

  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/portfolio/:type" element={<Category />} />
      </Routes>

      {showFooter && <Footer />}
    </>
  );
}

export default App;
