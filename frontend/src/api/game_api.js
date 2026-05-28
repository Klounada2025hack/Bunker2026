const API_URL = import.meta.env.VITE_API_URL

export async function player_gen(){
    const response = await fetch(`${API_URL}/player_gen/`)
    const data = await response.json()
    return data
}

export async function prof_gen(){
    const response = await fetch(`${API_URL}/prof_gen/`)
    const data = await response.json()
    return data
}

export async function health_gen(){
    const response = await fetch(`${API_URL}/health_gen/`)
    const data = await response.json()
    return data
}

export async function phobia_gen(){
    const response = await fetch(`${API_URL}/phobia_gen/`)
    const data = await response.json()
    return data
}

export async function hobbie_gen(){
    const response = await fetch(`${API_URL}/hobbie_gen/`)
    const data = await response.json()
    return data
}

export async function char_gen(){
    const response = await fetch(`${API_URL}/char_gen/`)
    const data = await response.json()
    return data
}

export async function bunker_gen(){
    const response = await fetch(`${API_URL}/bunker_gen/`)
    const data = await response.json()
    return data
}

export async function disaster_gen(){
    const response = await fetch(`${API_URL}/disaster_gen/`)
    const data = await response.json()
    return data
}