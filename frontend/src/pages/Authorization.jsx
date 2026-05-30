import "../pages/container.css"
import { useState } from "react";
import Button from "../components/Button/button";
import Box from "../components/Box/Box";
import Smallbox from "../components/Box/smallbox";
import Button_reRoll from "../components/Button_reRoll/Button_reRoll";
import { useNavigate } from "react-router-dom";

export default function Authorization(){
    const [Name,setName] = useState("");
    const navigate = useNavigate();
    const handleLogin = () => {
        if(!Name.trim()) 
            
            return 
        alert("йоу имя то у тебя есть? Иначе сам придумаю!") 
        navigate("/home")
    }

    return(

    <div className="layout">
        <div className="Container">
            <Button_reRoll
                variant="input"
                value={Name}
                placeholder="Введите Свое имя"
                onChange={(e) => setName(e.target.value)}
            />
            <Button
                variant="small"
                text="Продолжить"
                onClick={handleLogin}
            />
        </div>
    </div>
  );
}


