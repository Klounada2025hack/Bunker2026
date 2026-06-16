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
    const [selectedAbility, setSelectedAbility] = useState("");

    useEffect(() => {
        if (!myId || !myName) navigate("/authorization");
        else if (!roomId) navigate("/lobby");
    }, [myId, myName, roomId, navigate]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(""), 4000);
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
                
                setGameStarted(!!data.is_started);
                setPlayers(Array.isArray(data.players) ? data.players : []);
                setBunkerCard(data.bunker_card || null);
                setDisasterCard(data.disaster_card || null);
                setMyCharacter(data.my_character || null);
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
        if (ability.text.includes("любого игрока") || ability.text.includes("поменяться")) {
            setSelectedAbility(ability.text);
            setShowTargetModal(true);
        } else {
            applyAbility(ability.text, null);
        }
    };

    const applyAbility = async (abilityText, targetId) => {
        const targetName = targetId ? players.find(p => p.id === targetId)?.name : "себя";
        try {
            await AbilityApi(roomId, abilityText, targetId);
            setNotification(`${myName} использовал "${abilityText}" на ${targetName}!`);
            setShowTargetModal(false);
        } catch (error) {
            alert(error.message);
        }
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
                        <button className="btn-start-game" onClick={handleStartGame}>
                            НАЧАТЬ ИГРУ
                        </button>
                    ) : (
                        <p className="waiting-msg">Ждите, пока хост начнет игру...</p>
                    )}
                    
                    <button className="btn-leave" onClick={() => navigate("/lobby")}>
                        Покинуть лобби
                    </button>
                </div>
            </div>
        );
    }

    // ЭКРАН ИГРЫ
    return (
        <div className="game-layout">
            {notification && <div className="toast">{notification}</div>}
            
            <div className="sidebar">
                <h3 className="sidebar-title">Игроки в бункере ({players.length})</h3>
                <div className="sidebar-list">
                    {players.map(player => (
                        <div key={player.id} className={`player-row ${!player.is_alive ? 'kicked' : ''}`}>
                            <span>{player.name}</span>
                            {player.is_host && <span className="badge-host">Host</span>}
                            {isHost && player.is_alive && player.id !== myId && (
                                <button className="btn-kick" onClick={() => handleKick(player.id)}>КИК</button>
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

                <div className="board-row mid-row">
                    <Box title={`МОЙ ПЕРСОНАЖ: ${myName}`} className="game-box">
                        {myCharacter ? Object.entries(myCharacter).map(([k, v]) => (
                            <div key={k} className="char-item">
                                <strong>{k}</strong>
                                <span className="char-value">{String(v)}</span>
                            </div>
                        )) : <p>Загрузка...</p>}
                    </Box>
                </div>

                <div className="board-row bottom-row">
                    {myAbilities.map((ability, index) => (
                        <Box 
                            key={index} 
                            title={`КАРТА СПОСОБНОСТИ ${index + 1}`} 
                            className={`game-box ability-box ${ability.used ? "used" : ""}`} 
                            onClick={() => handleAbilityClick(ability)}
                        >
                            <p className="ability-text">{ability.text}</p>
                            {ability.used && <p className="ability-used">ИСПОЛЬЗОВАНО</p>}
                        </Box>
                    ))}
                </div>
            </div>

            {showTargetModal && (
                <div className="modal-overlay" onClick={() => setShowTargetModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Выберите цель для карты:</h3>
                        <p style={{color: 'var(--accent)', fontStyle: 'italic', margin: '10px 0'}}>"{selectedAbility}"</p>
                        <div className="target-list">
                            {players.filter(p => p.is_alive && p.id !== myId).map(player => (
                                <button key={player.id} className="target-btn" onClick={() => applyAbility(selectedAbility, player.id)}>
                                    {player.name}
                                </button>
                            ))}
                        </div>
                        <button className="btn-leave" onClick={() => setShowTargetModal(false)}>Отмена</button>
                    </div>
                </div>
            )}
        </div>
    );
}