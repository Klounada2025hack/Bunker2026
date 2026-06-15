const API_URL = import.meta.env.VITE_API_URL

export async function player_gen(){
    const response = await fetch(`${API_URL}/player_gen/`)
    return await response.json()
}

export async function prof_gen(){
    const response = await fetch(`${API_URL}/prof_gen/`)
    return await response.json()
}

export async function health_gen(){
    const response = await fetch(`${API_URL}/health_gen/`)
    return await response.json()
}

export async function phobia_gen(){
    const response = await fetch(`${API_URL}/phobia_gen/`)
    return await response.json()
}

export async function hobbie_gen(){
    const response = await fetch(`${API_URL}/hobbie_gen/`)
    return await response.json()
}

export async function char_gen(){
    const response = await fetch(`${API_URL}/char_gen/`)
    return await response.json()
}

export async function bunker_gen(){
    const response = await fetch(`${API_URL}/bunker_gen/`)
    return await response.json()
}

export async function disaster_gen(){
    const response = await fetch(`${API_URL}/disaster_gen/`)
    return await response.json()
}

export async function createRoom(userId, userName) {
    const response = await fetch(
        `${API_URL}/api/create_room/${userId}/${encodeURIComponent(userName)}`,
        { method: "POST" }
    )
    if (!response.ok) throw new Error("Не удалось создать комнату")
    return await response.json()
}


export async function joinRoom(roomId, userId, userName) {
    const response = await fetch(
        `${API_URL}/api/join_room/${roomId}/${userId}/${encodeURIComponent(userName)}`,
        { method: "POST" }
    )
    if (!response.ok) throw new Error("Комната не найдена или игра уже началась")
    return await response.json()
}


export async function startGame(roomId) {
    const response = await fetch(
        `${API_URL}/api/start_game/${roomId}`,
        { method: "POST" }
    )
    if (!response.ok) throw new Error("Не удалось начать игру")
    return await response.json()
}


export async function getGameState(roomId, userId) {
    const response = await fetch(
        `${API_URL}/api/game_state/${roomId}/${userId}`
    )
    if (!response.ok) throw new Error("Не удалось загрузить состояние")
    return await response.json()
}


export async function useAbility(roomId, userId, abilityText, targetPlayerId = null) {
    const response = await fetch(
        `${API_URL}/api/use_ability/${roomId}/${userId}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ability_text: abilityText,
                target_player_id: targetPlayerId
            })
        }
    )
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Ошибка использования способности")
    }
    return await response.json()
}


export async function kickPlayer(roomId, targetId) {
    const response = await fetch(
        `${API_URL}/api/kick_player/${roomId}/${targetId}`,
        { method: "POST" }
    )
    if (!response.ok) throw new Error("Не удалось кикнуть игрока")
    return await response.json()
}