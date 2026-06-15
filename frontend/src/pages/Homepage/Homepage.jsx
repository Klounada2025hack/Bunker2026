import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Box from "../../components/Box/Box";
import Button from "../../components/Button/button";
import { startGame, getGameState, useAbility as AbilityApi, kickPlayer } from "../../api/game_api";
import "../container.css";

export default function Homepage() {
    const navigate = useNavigate();
    
    const [gameStarted, setGameStarted] = useState(false);
    const [isHost,] = useState(() => localStorage.getItem("isCreator") === "true");
    const [myName,] = useState(() => localStorage.getItem("currentUserName") || "");
    const [myId,] = useState(() => localStorage.getItem("currentUserId") || "");
    const [roomId,] = useState(() => localStorage.getItem("roomId") || "");
    
    const [players, setPlayers] = useState([]);
    const [myCharacter, setMyCharacter] = useState(null);
    const [bunkerCard, setBunkerCard] = useState(null);
    const [disasterCard, setDisasterCard] = useState(null);
    const [myAbilities, setMyAbilities] = useState([]);
    
    const [notification, setNotification] = useState("");
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [selectedAbility, setSelectedAbility] = useState("");

    const isMountedRef = useRef(true);

    useEffect(() => {
    if (!myId || !myName) {
        navigate("/authorization");
        return;
    }
    if (!roomId) {
        navigate("/lobby");
        return;
    }
    }, [myId, myName, roomId, navigate]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(""), 4000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const loadGameState = useCallback(async () => {
        if (!roomId || !myId) return;
        
        try {
            const data = await getGameState(roomId, myId);
            
            if (!isMountedRef.current) return;
            
            setGameStarted(data.is_started);
            setBunkerCard(data.bunker_card);
            setDisasterCard(data.disaster_card);
            setMyCharacter(data.my_character);
            setMyAbilities(data.my_abilities);
            setPlayers(data.players);
        } catch (error) {
            console.error("Ошибка загрузки состояния:", error);
        }
    }, [roomId, myId]);


    const loadGameStateRef = useRef(loadGameState);

    useEffect(() => {
        loadGameStateRef.current = loadGameState;
    }, [loadGameState]);


    useEffect(() => {
        if (roomId && myId) {

            const timeoutId = setTimeout(() => {
                loadGameStateRef.current();
            }, 0);
            
            const interval = setInterval(() => {
                loadGameStateRef.current();
            }, 2000);
            
            return () => {
                clearTimeout(timeoutId);
                clearInterval(interval);
            };
        }
    }, [roomId, myId]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const handleStartGame = async () => {
        try {
            await startGame(roomId);
            await loadGameState();
            showNotification("Игра началась! Карты розданы.");
        } catch (error) {
            console.error("Ошибка старта:", error);
            alert("Не удалось начать игру");
        }
    };

    const handleAbilityClick = (ability) => {
        if (ability.used) return;
        
        const text = ability.text;
        
        if (text.includes("любого игрока") || text.includes("поменяться")) {
            setSelectedAbility(text);
            setShowTargetModal(true);
        } else {
            applyAbility(text, null);
        }
    };

    const applyAbility = async (abilityText, targetId) => {
        const targetName = targetId 
            ? players.find(p => p.id === targetId)?.name 
            : "себя";
        
        try {
            await AbilityApi(roomId, myId, abilityText, targetId);
            await loadGameState();
            
            showNotification(`${myName} использовал "${abilityText}" на ${targetName}!`);
            setShowTargetModal(false);
        } catch (error) {
            console.error("Ошибка использования способности:", error);
            alert(error.message);
        }
    };

    const applyTargetEffect = (targetId) => {
        applyAbility(selectedAbility, targetId);
    };

    const handleKick = async (targetId) => {
        try {
            await kickPlayer(roomId, targetId);
            await loadGameState();
            showNotification("Игрок кикнут из бункера.");
        } catch (error) {
            console.error("Ошибка кика:", error);
            alert("Не удалось кикнуть игрока");
        }
    };

    const showNotification = (msg) => setNotification(msg);

    if (!gameStarted) {
        return (
            <div className="layoutAuth">
                <div className="Container" style={{ textAlign: "center" }}>
                    <h1>Комната: {roomId}</h1>
                    <p>Ожидание игроков... ({players.length})</p>
                    {isHost ? (
                        <Button variant="large" text="НАЧАТЬ ИГРУ" onClick={handleStartGame} />
                    ) : (
                        <p style={{ color: "#f1c40f" }}>Ждите, пока хост начнет игру...</p>
                    )}
                    <button 
                        className="cancel-btn" 
                        style={{marginTop: '20px'}} 
                        onClick={() => navigate("/lobby")}
                    >
                        Покинуть лобби
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="game-layout">
            {notification && <div className="notification-toast">{notification}</div>}

            <div className="sidebar">
                <h3>Игроки в бункере</h3>
                {players.map(player => (
                    <div key={player.id} className={`player-item ${!player.is_alive ? 'kicked' : ''}`}>
                        <span>{player.name} {player.is_host}</span>
                        {isHost && player.is_alive && player.id !== myId && (
                            <button className="kick-btn" onClick={() => handleKick(player.id)}>КИК</button>
                        )}
                    </div>
                ))}
                <button 
                    className="cancel-btn" 
                    style={{marginTop: 'auto'}} 
                    onClick={() => navigate("/lobby")}
                >
                    Покинуть игру
                </button>
            </div>

            <div className="main-board">
                <div className="top-row">
                    <Box title="БУНКЕР">
                        {bunkerCard ? Object.entries(bunkerCard).map(([k, v]) => (
                            <div key={k}><strong>{k}:</strong> {String(v)}</div>
                        )) : "Загрузка..."}
                    </Box>
                    <Box title="КАТАСТРОФА">
                        {disasterCard ? Object.entries(disasterCard).map(([k, v]) => (
                            <div key={k}><strong>{k}:</strong> {String(v)}</div>
                        )) : "Загрузка..."}
                    </Box>
                </div>

                <div className="mid-row">
                    <Box title={`МОЙ ПЕРСОНАЖ: ${myName}`}>
                        {myCharacter ? Object.entries(myCharacter).map(([k, v]) => (
                            <div key={k} style={{ marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                                <strong>{k}</strong><br/>
                                <span style={{ fontSize: '1.1em', color: '#f1c40f' }}>{String(v)}</span>
                            </div>
                        )) : "Загрузка..."}
                    </Box>
                </div>

                <div className="bottom-row">
                    {myAbilities.map((ability, index) => (
                        <Box 
                            key={index} 
                            title={`КАРТА СПОСОБНОСТИ ${index + 1}`}
                            className={ability.used ? "used" : ""}
                            onClick={() => handleAbilityClick(ability)}
                        >
                            <p style={{ fontSize: '1.1em', lineHeight: '1.4' }}>
                                {ability.text}
                            </p>
                            {ability.used && <p style={{color: 'red', fontWeight: 'bold', marginTop: '10px'}}>ИСПОЛЬЗОВАНО</p>}
                        </Box>
                    ))}
                </div>
            </div>

            {showTargetModal && (
                <div className="modal-overlay" onClick={() => setShowTargetModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Выберите цель для карты:</h3>
                        <p style={{color: '#f1c40f', fontStyle: 'italic'}}>"{selectedAbility}"</p>
                        <div className="target-list">
                            {players.filter(p => p.is_alive && p.id !== myId).map(player => (
                                <button 
                                    key={player.id} 
                                    className="target-btn"
                                    onClick={() => applyTargetEffect(player.id)}
                                >
                                    {player.name}
                                </button>
                            ))}
                        </div>
                        <button className="cancel-btn" onClick={() => setShowTargetModal(false)}>Отмена</button>
                    </div>
                </div>
            )}
        </div>
    );
}