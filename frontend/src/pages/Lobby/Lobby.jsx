import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button/button";
import Button_reRoll from "../../components/Button_reRoll/Button_reRoll";
import Logo from "../../components/Logo/Logo";
import "../container.css";

export default function Lobby() {
    const [roomCode, setRoomCode] = useState("");
    const [showJoinInput, setShowJoinInput] = useState(false);
    const navigate = useNavigate();


    useEffect(() => {
        const userId = localStorage.getItem("currentUserId");
        if (!userId) {
            navigate("/authorization");
        }
    }, [navigate]);

    const generateRoomCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handleGenerator = () => {
        navigate("/Gen");

    }

    const handleCreateRoom = () => {
        const code = generateRoomCode();
        
        localStorage.setItem("roomCode", code);
        localStorage.setItem("isCreator", "true");
        
        console.log("Комната создана. Код:", code);
        navigate("/home");
    };


    const handleJoinRoom = () => {
        if (!roomCode.trim() || roomCode.length < 4) {
            alert("Введите корректный код комнаты (6 символа)!");
            return;
        }

        localStorage.setItem("roomCode", roomCode.toUpperCase());
        localStorage.setItem("isCreator", "false");
        navigate("/home");
    };


    const handleInputChange = (e) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
        setRoomCode(value);
    };

    return (
        <div className="layoutAuth">
            <div className="Container">
                <Logo />
                
                {!showJoinInput ? (

                    <div className="lobby-buttons">
                        <Button
                            variant="small"
                            text="Создать комнату"
                            onClick={handleCreateRoom}
                        />
                        <Button
                            variant="small"
                            text="Присоединиться"
                            onClick={() => setShowJoinInput(true)}
                        />
                        <Button
                            variant="small"
                            text="Генератор"
                            onClick={handleGenerator}
                        />
                    </div>
                ) : (

                    <div className="lobby-join">
                        <Button_reRoll
                            variant="input"
                            value={roomCode}
                            placeholder="КОД КОМНАТЫ"
                            onChange={handleInputChange}
                        />
                        <div className="lobby-actions">
                            <Button
                                variant="small"
                                text="Войти"
                                onClick={handleJoinRoom}
                            />
                            <Button
                                variant="small"
                                text="Назад"
                                onClick={() => {
                                    setShowJoinInput(false);
                                    setRoomCode("");
                                }}

                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}