import './App.css'
import Homepage from "./pages/Homepage"
import Authorization from "./pages/Authorization"
import { Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Authorization />} />
      <Route path="/home" element={<Homepage />} />
    </Routes>
  );
}
