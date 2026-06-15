from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional, List
import uuid
import random
from app.bunker import Bunker_generator
from app.player import Generator_player
from app.catastrophe import Catastophe_gen
from app.reRoll.prof_gen import Generator_prof
from app.reRoll.health_gen import Generator_health
from app.reRoll.char_gen import Generator_char
from app.reRoll.phobia_gen import Generator_phobia
from app.reRoll.hobbie_gen import Generator_hob
from app.name_to_id import generate_user_id

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PlayerState(BaseModel):
    user_id: str
    name: str
    character_card: dict = {}
    abilities: List[str] = []
    used_abilities: List[str] = []
    is_alive: bool = True

class RoomState(BaseModel):
    room_id: str
    host_id: str
    is_started: bool = False
    bunker_card: Optional[dict] = None
    disaster_card: Optional[dict] = None
    players: Dict[str, PlayerState] = {}


game_rooms: Dict[str, RoomState] = {}


ALL_ABILITIES = [
    "сменить себе профессию",
    "сменить себе фобию",
    "сменить себе хобби",
    "сменить себе здоровье",
    "сменить себе багаж",
    "изменить профессию любого игрока",
    "изменить фобию любого игрока",
    "изменить хобби любого игрока",
    "изменить здоровье любого игрока",
    "изменить багаж любого игрока",
    "воскресить любого игрока",
    "сменить проффесии всех игроков",
    "уменьшить бункер на 1",
    "увеличить бункер на 1",
    "рядом есть ещё один бункер, в котором есть 2 плодовитых мужчин",
    "рядом есть ещё один бункер, в котором есть 2 плодовитых женщины",
    "бункер находится около пресного озера",
    "бункер находится в лесу",
    "у бункера есть гараж и машина",
    "в бункере оказывается инопланетянин",
    "карта врага (если человек слева от тебя попадает в бункер - ты нет)",
    "карта врага (если человек справа от тебя попадает в бункер - ты нет)",
    "карта врага (если человек напротив тебя попадает в бункер - ты нет)",
    "Карта друга (если человек напротив тебя не попадает в бункер - ты тоже)",
    "Карта друга (если человек слева от тебя не попадает в бункер - ты тоже)",
    "Карта друга (если человек после тебя не попадает в бункер - ты тоже)",
    "раскрыть любую характеристику любого игрока (твой выбор)",
    "раскрыть случайную характеристику любого игрока (его выбор)",
    "защита на 1 ход любого игрока от голосования",
    "вылечить бесплодие любого игрока",
    "омолодить любого игрока на 15 лет если он старше 30",
    "поменяться картой состояние здоровья с любым игроком",
    "поменяться картой проффесия с любым игроком",
    "поменяться картой биологические данные с любым игроком",
    "поменяться картой фобия с любым игроком",
    "поменяться картой багаж с любым игроком",
    "поменяться картой хобби с любым игроком",
    "поменяться картой черта характера с любым игроком",
    "в следующем ходу все игроки раскрывают выбранную вами характеристику",
    "рядом с вашим бункером находиться враждебный бункер",
    "украсть все запасы еды и воды из бункера",
    "украсть все предметы кроме еды и воды из бункера"
]

# === СУЩЕСТВУЮЩИЕ API (оставляем как есть) ===

@app.get("/player_gen/")
def player_gen():
    return Generator_player.generate_card()
    
@app.get("/bunker_gen/")
def bunker_gen():
    return Bunker_generator.generate_card()
    
@app.get("/disaster_gen/")
def disaster_gen():
    return Catastophe_gen.generate_card()

@app.get("/prof_gen/")
def prof_gen():
    return Generator_prof.generate_card()

@app.get("/char_gen/")
def char_gen():
    return Generator_char.generate_card()

@app.get("/hobbie_gen/")
def hobbie_gen():
    return Generator_hob.generate_card()

@app.get("/health_gen/")
def health_gen():
    return Generator_health.generate_card()

@app.get("/phobia_gen/")
def phobia_gen():
    return Generator_phobia.generate_card()

class UserLoginData(BaseModel):
    name: str

@app.post("/api/set_name")
async def receive_user_name(data: UserLoginData):
    user_id = generate_user_id(data.name)
    return {
        "status": "success",
        "name": data.name,
        "id": user_id
    }



@app.post("/api/create_room/{user_id}/{user_name}")
async def create_room(user_id: str, user_name: str):
    """Создать новую комнату"""
    room_id = str(uuid.uuid4())[:8].upper()
    
    room = RoomState(
        room_id=room_id,
        host_id=user_id,
        players={
            user_id: PlayerState(
                user_id=user_id,
                name=user_name,
                is_alive=True
            )
        }
    )
    game_rooms[room_id] = room
    
    return {"room_id": room_id, "status": "success"}


@app.post("/api/join_room/{room_id}/{user_id}/{user_name}")
async def join_room(room_id: str, user_id: str, user_name: str):
    """Присоединиться к комнате"""
    if room_id not in game_rooms:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    
    room = game_rooms[room_id]
    if room.is_started:
        raise HTTPException(status_code=400, detail="Игра уже началась")
    
    if user_id not in room.players:
        room.players[user_id] = PlayerState(
            user_id=user_id,
            name=user_name,
            is_alive=True
        )
    
    return {"status": "success", "room": room.dict()}


@app.post("/api/start_game/{room_id}")
async def start_game(room_id: str):
    """Хост начинает игру - генерируются карты для всех"""
    if room_id not in game_rooms:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    
    room = game_rooms[room_id]
    if room.is_started:
        return {"status": "already_started"}
    

    room.bunker_card = Bunker_generator.generate_card()
    room.disaster_card = Catastophe_gen.generate_card()
    

    for user_id, player in room.players.items():
        player.character_card = Generator_player.generate_card()
        player.abilities = random.sample(ALL_ABILITIES, min(2, len(ALL_ABILITIES)))
    
    room.is_started = True
    return {"status": "success", "room": room.dict()}


@app.get("/api/game_state/{room_id}/{user_id}")
async def get_game_state(room_id: str, user_id: str):
    """Получить текущее состояние комнаты"""
    if room_id not in game_rooms:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    
    room = game_rooms[room_id]
    player = room.players.get(user_id)
    
    if not player:
        raise HTTPException(status_code=404, detail="Игрок не в комнате")
    
    return {
        "room_id": room.room_id,
        "host_id": room.host_id,
        "is_started": room.is_started,
        "bunker_card": room.bunker_card,
        "disaster_card": room.disaster_card,
        "my_character": player.character_card,
        "my_abilities": [
            {"text": ab, "used": ab in player.used_abilities}
            for ab in player.abilities
        ],
        "players": [
            {
                "id": p.user_id,
                "name": p.name,
                "is_alive": p.is_alive,
                "is_host": (p.user_id == room.host_id)
            }
            for p in room.players.values()
        ]
    }


class UseAbilityRequest(BaseModel):
    ability_text: str
    target_player_id: Optional[str] = None

@app.post("/api/use_ability/{room_id}/{user_id}")
async def use_ability(room_id: str, user_id: str, request: UseAbilityRequest):
    """Игрок использует способность"""
    if room_id not in game_rooms:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    
    room = game_rooms[room_id]
    player = room.players.get(user_id)
    
    if not player or request.ability_text not in player.abilities:
        raise HTTPException(status_code=400, detail="Способность недоступна")
    
    if request.ability_text in player.used_abilities:
        raise HTTPException(status_code=400, detail="Способность уже использована")
    
    ability = request.ability_text
    
    if "сменить себе" in ability:
        if "профессию" in ability:
            new_prof = Generator_prof.generate_card()
            player.character_card["Работа"] = new_prof["Профессия"]
            player.character_card["Стаж"] = new_prof["Стаж"]
        elif "фобию" in ability:
            new_phobia = Generator_phobia.generate_card()
            player.character_card["Фобия"] = new_phobia["Фобия"]
        elif "хобби" in ability:
            new_hob = Generator_hob.generate_card()
            player.character_card["Хобби"] = new_hob["Хобби"]
        elif "здоровье" in ability:
            new_health = Generator_health.generate_card()
            player.character_card["Диагноз"] = new_health["Диагноз"]
            player.character_card["Прогресс"] = new_health["Прогресс"]
        elif "багаж" in ability:
            new_char = Generator_player.generate_card()
            player.character_card["Багаж"] = new_char["Багаж"]
    
    elif "любого игрока" in ability and request.target_player_id:
        target = room.players.get(request.target_player_id)
        if target:
            if "профессию" in ability:
                new_prof = Generator_prof.generate_card()
                target.character_card["Работа"] = new_prof["Профессия"]
                target.character_card["Стаж"] = new_prof["Стаж"]
            elif "фобию" in ability:
                new_phobia = Generator_phobia.generate_card()
                target.character_card["Фобия"] = new_phobia["Фобия"]
            elif "хобби" in ability:
                new_hob = Generator_hob.generate_card()
                target.character_card["Хобби"] = new_hob["Хобби"]
            elif "здоровье" in ability:
                new_health = Generator_health.generate_card()
                target.character_card["Диагноз"] = new_health["Диагноз"]
                target.character_card["Прогресс"] = new_health["Прогресс"]
            elif "багаж" in ability:
                new_char = Generator_player.generate_card()
                target.character_card["Багаж"] = new_char["Багаж"]
            elif "воскресить" in ability:
                target.is_alive = True
    
    elif "поменяться" in ability and request.target_player_id:
        target = room.players.get(request.target_player_id)
        if target:
            if "професия" in ability or "проффесия" in ability:
                player.character_card["Работа"], target.character_card["Работа"] = \
                    target.character_card["Работа"], player.character_card["Работа"]
                player.character_card["Стаж"], target.character_card["Стаж"] = \
                    target.character_card["Стаж"], player.character_card["Стаж"]
            elif "фобия" in ability:
                player.character_card["Фобия"], target.character_card["Фобия"] = \
                    target.character_card["Фобия"], player.character_card["Фобия"]
            elif "хобби" in ability:
                player.character_card["Хобби"], target.character_card["Хобби"] = \
                    target.character_card["Хобби"], player.character_card["Хобби"]
            elif "здоровье" in ability or "состояние здоровья" in ability:
                player.character_card["Диагноз"], target.character_card["Диагноз"] = \
                    target.character_card["Диагноз"], player.character_card["Диагноз"]
                player.character_card["Прогресс"], target.character_card["Прогресс"] = \
                    target.character_card["Прогресс"], player.character_card["Прогресс"]
            elif "багаж" in ability:
                player.character_card["Багаж"], target.character_card["Багаж"] = \
                    target.character_card["Багаж"], player.character_card["Багаж"]
    
    elif "бункер" in ability or "всех" in ability:
        if "увеличить" in ability:
            room.bunker_card["Размер бункера"] = room.bunker_card.get("Размер бункера", 100) + 50
        elif "уменьшить" in ability:
            room.bunker_card["Размер бункера"] = max(50, room.bunker_card.get("Размер бункера", 100) - 50)
        elif "лесу" in ability:
            room.bunker_card["Расположение"] = "В лесу"
        elif "озера" in ability:
            room.bunker_card["Расположение"] = "Около пресного озера"
        elif "гараж" in ability:
            room.bunker_card["Дополнительно"] = "Есть гараж и машина"
        elif "инопланетянин" in ability:
            room.bunker_card["Дополнительно"] = "В бункере находится инопланетянин"
        elif "профессии всех" in ability:
            for p in room.players.values():
                new_prof = Generator_prof.generate_card()
                p.character_card["Работа"] = new_prof["Профессия"]
                p.character_card["Стаж"] = new_prof["Стаж"]
    
    player.used_abilities.append(request.ability_text)
    
    return {"status": "success", "message": f"Способность '{ability}' использована"}


@app.post("/api/kick_player/{room_id}/{target_id}")
async def kick_player(room_id: str, target_id: str):
    """Хост кикает игрока"""
    if room_id not in game_rooms:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    
    room = game_rooms[room_id]
    target = room.players.get(target_id)
    
    if not target:
        raise HTTPException(status_code=404, detail="Игрок не найден")
    
    target.is_alive = False
    return {"status": "success", "message": f"Игрок {target.name} кикнут"}