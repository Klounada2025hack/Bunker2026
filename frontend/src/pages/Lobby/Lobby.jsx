import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button/button";
import Button_reRoll from "../../components/Button_reRoll/Button_reRoll";
import Logo from "../../components/Logo/Logo";
import { createRoom, joinRoom } from "../../api/game_api";
import "../container.css";

export default function Lobby() {
    const [roomCode, setRoomCode] = useState("");
    const [showJoinInput, setShowJoinInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const userId = localStorage.getItem("currentUserId");
        if (!userId) {
            navigate("/authorization");
        }
    }, [navigate]);

    const handleGenerator = () => {
        navigate("/Gen");
    };

    const handleCreateRoom = async () => {
        const userId = localStorage.getItem("currentUserId");
        const userName = localStorage.getItem("currentUserName");

        setLoading(true);
        try {
            const data = await createRoom(userId, userName);
            
            localStorage.setItem("roomId", data.room_id);
            localStorage.setItem("isCreator", "true");
            
            console.log("Комната создана на сервере. ID:", data.room_id);
            navigate("/home");
        } catch (error) {
            console.error("Ошибка создания комнаты:", error);
            alert("Не удалось создать комнату");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!roomCode.trim() || roomCode.length < 8) {
            alert("Введите корректный код комнаты (надо 8 символов)!");
            return;
        }

        const userId = localStorage.getItem("currentUserId");
        const userName = localStorage.getItem("currentUserName");
        const roomId = roomCode.toUpperCase();

        setLoading(true);
        try {
            await joinRoom(roomId, userId, userName);
            
            localStorage.setItem("roomId", roomId);
            localStorage.setItem("isCreator", "false");
            
            console.log("Присоединились к комнате:", roomId);
            navigate("/home");
        } catch (error) {
            console.error("Ошибка присоединения:", error);
            alert("Комната не найдена или игра уже началась");
        } finally {
            setLoading(false);
        }
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
                            text={loading ? "Создание..." : "Создать комнату"}
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
                                text={loading ? "Вход..." : "Войти"}
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