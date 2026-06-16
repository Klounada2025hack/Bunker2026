const API_URL = import.meta.env.VITE_API_URL

const getHeaders = () => {
    const userId = localStorage.getItem("currentUserId")
    return {
        "Content-Type": "application/json",
        "X-User-Id": userId || ""
    }
}

export async function player_gen(){ return (await fetch(`${API_URL}/player_gen/`)).json() }
export async function prof_gen(){ return (await fetch(`${API_URL}/prof_gen/`)).json() }
export async function health_gen(){ return (await fetch(`${API_URL}/health_gen/`)).json() }
export async function phobia_gen(){ return (await fetch(`${API_URL}/phobia_gen/`)).json() }
export async function hobbie_gen(){ return (await fetch(`${API_URL}/hobbie_gen/`)).json() }
export async function char_gen(){ return (await fetch(`${API_URL}/char_gen/`)).json() }
export async function bunker_gen(){ return (await fetch(`${API_URL}/bunker_gen/`)).json() }
export async function disaster_gen(){ return (await fetch(`${API_URL}/disaster_gen/`)).json() }

export async function createRoom(userName) {
    const response = await fetch(`${API_URL}/api/create_room`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ user_name: userName })
    })
    if (!response.ok) throw new Error("Не удалось создать комнату")
    return await response.json()
}

export async function joinRoom(roomId, userName) {
    const response = await fetch(`${API_URL}/api/join_room/${roomId}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ user_name: userName })
    })
    if (!response.ok) throw new Error("Комната не найдена или игра уже началась")
    return await response.json()
}

export async function startGame(roomId) {
    const response = await fetch(`${API_URL}/api/start_game/${roomId}`, {
        method: "POST",
        headers: getHeaders()
    })
    if (!response.ok) throw new Error("Не удалось начать игру")
    return await response.json()
}

export async function getGameState(roomId) {
    const response = await fetch(`${API_URL}/api/game_state/${roomId}`, {
        headers: getHeaders()
    })
    if (!response.ok) throw new Error("Не удалось загрузить состояние")
    return await response.json()
}

export async function useAbility(roomId, abilityText, targetPlayerId = null) {
    const response = await fetch(`${API_URL}/api/use_ability/${roomId}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
            ability_text: abilityText,
            target_player_id: targetPlayerId
        })
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Ошибка использования способности")
    }
    return await response.json()
}

export async function kickPlayer(roomId, targetId) {
    const response = await fetch(`${API_URL}/api/kick_player/${roomId}/${targetId}`, {
        method: "POST",
        headers: getHeaders()
    })
    if (!response.ok) throw new Error("Не удалось кикнуть игрока")
    return await response.json()
}