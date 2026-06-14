import "../pages/container.css"
import { useState } from "react";
import Button from "../components/Button/button";
import Box from "../components/Box/Box";
import Smallbox from "../components/Box/smallbox";
import Button_reRoll from "../components/Button_reRoll/Button_reRoll";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo/Logo"

export default function Authorization() {
    const [Name, setName] = useState("");
    const navigate = useNavigate();


    const handleInputChange = (e) => {
        const validValue = e.target.value.replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, "");
        setName(validValue);
    };

    const handleLogin = async () => {
        if (!Name.trim()) {
            alert("йоу имя то у тебя есть? Иначе сам придумаю!");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:8000/api/set_name", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: Name }), 
            });

            if (response.ok) {
                navigate("/home");
            } else {
                alert("Ошибка на сервере при сохранении имени");
            }
        } catch (error) {
            console.error("Ошибка сети:", error);
            alert("Не удалось соединиться с сервером. Запущен ли бэкенд?");
        }
    };

    return (
        <div className="layoutAuth">
            <div className="Container">
                <Logo />
                <Button_reRoll
                    variant="input"
                    value={Name}
                    placeholder="Введите Свое имя"
                    onChange={handleInputChange}
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