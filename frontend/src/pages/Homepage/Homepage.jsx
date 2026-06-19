import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Box from "../../components/Box/Box";
import Button from "../../components/Button/button";
import { startGame, getGameState, useAbility as AbilityApi, kickPlayer } from "../../api/game_api";
import "../GameStyles.css"; 
import "../container.css";

export default function Homepage() {
    const navigate = useNavigate();
    
    const [gameStarted, setGameStarted] = useState(false);
    const [isHost] = useState(() => localStorage.getItem("isCreator") === "true");
    const [myName] = useState(() => localStorage.getItem("currentUserName") || "");
    const [myId] = useState(() => localStorage.getItem("currentUserId") || "");
    const [roomId] = useState(() => localStorage.getItem("roomId") || "");
    
    const [players, setPlayers] = useState([]);
    const [myCharacter, setMyCharacter] = useState(null);
    const [bunkerCard, setBunkerCard] = useState(null);
    const [disasterCard, setDisasterCard] = useState(null);
    const [myAbilities, setMyAbilities] = useState([]);
    
    const [notification, setNotification] = useState("");
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedAbility, setSelectedAbility] = useState("");
    const [pendingTargetId, setPendingTargetId] = useState(null);

    useEffect(() => {
        if (!myId || !myName) navigate("/authorization");
        else if (!roomId) navigate("/lobby");
    }, [myId, myName, roomId, navigate]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        if (!roomId || !myId) return;
        let isCancelled = false;

        const fetchData = async () => {
            try {
                const data = await getGameState(roomId);
                if (isCancelled) return;
                
                console.log("[FRONTEND DEBUG] Получены данные:", data);
                console.log("[FRONTEND DEBUG] my_character:", data.my_character);
                
                setGameStarted(!!data.is_started);
                setPlayers(Array.isArray(data.players) ? data.players : []);
                setBunkerCard(data.bunker_card || null);
                setDisasterCard(data.disaster_card || null);
                
                // Принудительно создаём новый объект для React
                const newCharacter = data.my_character ? JSON.parse(JSON.stringify(data.my_character)) : null;
                console.log("[FRONTEND DEBUG] Новая карточка персонажа:", newCharacter);
                setMyCharacter(newCharacter);
                
                setMyAbilities(Array.isArray(data.my_abilities) ? data.my_abilities : []);
            } catch (error) {
                console.error(error);
            }
        };

        fetchData(); 
        const intervalId = setInterval(fetchData, 2000); 
        return () => { isCancelled = true; clearInterval(intervalId); };
    }, [roomId, myId]);

    const handleStartGame = async () => {
        try {
            await startGame(roomId);
            setNotification("Игра началась! Карты розданы.");
        } catch (error) {
            alert("Не удалось начать игру: " + error.message);
        }
    };

    const handleAbilityClick = (ability) => {
        if (ability.used) return;
        
        if (ability.type === "positional") return;
        
        setSelectedAbility(ability.text);
        
        if (ability.type === "target_player" || ability.type === "swap") {
            setShowTargetModal(true);
        } 
        else if (ability.type === "self" || ability.type === "bunker" || 
                 ability.type === "all_players" || ability.type === "reveal") {
            setShowConfirmModal(true);
        }
    };

    const confirmAbility = async () => {
        try {
            await AbilityApi(roomId, selectedAbility, null);
            setNotification({
                title: `${myName} использовал способность`,
                text: selectedAbility
            });
            setShowConfirmModal(false);
            setSelectedAbility("");
            
            // Принудительно обновляем данные сразу после использования способности
            setTimeout(async () => {
                const data = await getGameState(roomId);
                const newCharacter = data.my_character ? JSON.parse(JSON.stringify(data.my_character)) : null;
                setMyCharacter(newCharacter);
            }, 500);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleTargetSelect = (targetId) => {
        setPendingTargetId(targetId);
        setShowTargetModal(false);
        setShowConfirmModal(true);
    };

    const confirmAbilityWithTarget = async () => {
        const targetName = players.find(p => p.id === pendingTargetId)?.name || "игрока";
        try {
            await AbilityApi(roomId, selectedAbility, pendingTargetId);
            setNotification({
                title: `${myName} использовал способность на ${targetName}`,
                text: selectedAbility
            });
            setShowConfirmModal(false);
            setSelectedAbility("");
            setPendingTargetId(null);
            
            // Принудительно обновляем данные сразу после использования способности
            setTimeout(async () => {
                const data = await getGameState(roomId);
                const newCharacter = data.my_character ? JSON.parse(JSON.stringify(data.my_character)) : null;
                setMyCharacter(newCharacter);
            }, 500);
        } catch (error) {
            alert(error.message);
        }
    };

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setSelectedAbility("");
        setPendingTargetId(null);
    };

    const handleKick = async (targetId) => {
        try {
            await kickPlayer(roomId, targetId);
            setNotification("Игрок кикнут из бункера.");
        } catch {
            alert("Не удалось кикнуть игрока");
        }
    };

    if (!gameStarted) {
        return (
            <div className="lobby-wrapper">
                <div className="lobby-card">
                    <h1 className="lobby-title">Комната: {roomId}</h1>
                    <p className="lobby-subtitle">Ожидание игроков... ({players.length})</p>
                    
                    <div className="players-list">
                        {players.map(p => (
                            <div key={p.id} className="player-card">
                                <span>{p.name}</span>
                                {p.is_host && <span className="badge-host">Host</span>}
                            </div>
                        ))}
                    </div>

                    {isHost ? (
                        <button 
                        className="btn-start-game" 
                        onClick={handleStartGame}>
                            НАЧАТЬ ИГРУ
                        </button>
                    ) : (
                        <p className="waiting-msg">Ждите, пока хост начнет игру...</p>
                    )}
                    
                    <button 
                    className="btn-leave" 
                    onClick={() => navigate("/lobby")}>
                        Покинуть лобби
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="game-layout">
            {notification && (
                <div className="toast toast-ability">
                    <div className="toast-title">{typeof notification === 'object' ? notification.title : notification}</div>
                    {typeof notification === 'object' && notification.text && (
                        <div className="toast-text">"{notification.text}"</div>
                    )}
                </div>
            )}
            
            <div className="sidebar">
                <h3 className="sidebar-title">Игроки в бункере ({players.length})</h3>
                <div className="sidebar-list">
                    {players.map(player => (
                        <div key={player.id} className={`player-row ${!player.is_alive ? 'kicked' : ''}`}>
                            <span>{player.name}</span>
                            {player.is_host && <span className="badge-host">Host</span>}
                            {isHost && player.is_alive && player.id !== myId && (
                                <button 
                                className="btn-kick" 
                                onClick={() => handleKick(player.id)}>КИК</button>
                            )}
                        </div>
                    ))}
                </div>
                <button className="btn-leave" style={{ marginTop: 'auto' }} onClick={() => navigate("/lobby")}>
                    Покинуть игру
                </button>
            </div>

            <div className="main-board">
                <div className="board-row top-row">
                    <Box title="БУНКЕР" className="game-box">
                        {bunkerCard ? Object.entries(bunkerCard).map(([k, v]) => (
                            <div key={k} className="box-item"><strong>{k}:</strong> {String(v)}</div>
                        )) : <p>Загрузка...</p>}
                    </Box>
                    <Box title="КАТАСТРОФА" className="game-box">
                        {disasterCard ? Object.entries(disasterCard).map(([k, v]) => (
                            <div key={k} className="box-item"><strong>{k}:</strong> {String(v)}</div>
                        )) : <p>Загрузка...</p>}
                    </Box>
                </div>
                <div className="board-row bottom-row">
                    <Box title={`МОЙ ПЕРСОНАЖ: ${myName}`} className="game-box character-box">
                        {Array.isArray(myCharacter) ? myCharacter.map((item, idx) => {
                            if (item.key === "__header__") {
                                return (
                                    <div key={idx} className="char-section-header">
                                        {item.value}
                                    </div>
                                );
                            }
                            return (
                                <div key={idx} className="char-item">
                                    <strong>{item.key}:</strong>
                                    <span className="char-value">{String(item.value)}</span>
                                </div>
                            );
                        }) : <p>Загрузка...</p>}
                    </Box>
                    
                    <div className="abilities-column">
                        {myAbilities.map((ability, index) => {
                            const isPositional = ability.type === "positional";
                            const isUsed = ability.used;
                            
                            return (
                                <div 
                                    key={index} 
                                    className={`ability-box ${isUsed ? "used" : ""} ${isPositional ? "positional" : ""}`} 
                                    onClick={() => handleAbilityClick(ability)}
                                >
                                    <h3>СПОСОБНОСТЬ {index + 1}</h3>
                                    <p className="ability-text">{ability.text}</p>
                                    {isUsed && <p className="ability-used">ИСПОЛЬЗОВАНО</p>}
                                    {isPositional && <p className="ability-positional">АВТО</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {showTargetModal && (
                <div className="modal-overlay" onClick={() => setShowTargetModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Выберите цель для карты:</h3>
                        <p className="modal-ability-text">"{selectedAbility}"</p>
                        <div className="target-list">
                            {players.filter(p => p.is_alive && p.id !== myId).map(player => (
                                <button key={player.id} className="target-btn" onClick={() => handleTargetSelect(player.id)}>
                                    {player.name}
                                </button>
                            ))}
                        </div>
                        <button className="btn-leave" onClick={() => setShowTargetModal(false)}>Отмена</button>
                    </div>
                </div>
            )}

            {showConfirmModal && (
                <div className="modal-overlay" onClick={closeConfirmModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>
                            {pendingTargetId 
                                ? `Подтвердите использование на ${players.find(p => p.id === pendingTargetId)?.name || "игроке"}:` 
                                : "Подтвердите использование карты:"}
                        </h3>
                        <p className="modal-ability-text">"{selectedAbility}"</p>
                        <div className="modal-actions">
                            <button className="btn-confirm" onClick={pendingTargetId ? confirmAbilityWithTarget : confirmAbility}>
                                ПОДТВЕРДИТЬ
                            </button>
                            <button className="btn-leave" onClick={closeConfirmModal}>ОТМЕНА</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}