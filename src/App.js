import Vibe from "./components/Prototype";
import Home from "./components/Home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/prototype" element={<Vibe />} />
      </Routes>
    </Router>
  );
}

export default App;
