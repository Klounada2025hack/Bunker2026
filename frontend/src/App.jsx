import './App.css'
import Homepage from "./pages/Homepage/Homepage"
import Authorization from "./pages/Authorization/Authorization"
import Lobby from "./pages/Lobby/Lobby" 
import Generator from './pages/Generator/Generator'
import { Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Authorization />} />
      <Route path="/authorization" element={<Authorization />} />
      <Route path="/lobby" element={<Lobby />} />      
      <Route path="/home" element={<Homepage />} />
      <Route path="/Gen" element={<Generator />} />
    </Routes>
  );
}