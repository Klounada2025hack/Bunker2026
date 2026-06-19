from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional, List
import uuid
import random
import asyncio
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

from sqlalchemy import create_engine, Column, String, Boolean, ForeignKey, func
from sqlalchemy.orm import declarative_base, relationship, sessionmaker, Session
from sqlalchemy.dialects.postgresql import JSONB

from app.bunker import Bunker_generator
from app.player import Generator_player
from app.catastrophe import Catastophe_gen
from app.reRoll.prof_gen import Generator_prof
from app.reRoll.health_gen import Generator_health
from app.reRoll.char_gen import Generator_char
from app.reRoll.phobia_gen import Generator_phobia
from app.reRoll.hobbie_gen import Generator_hob
from app.name_to_id import generate_user_id


#GamerZ0ne - password
DATABASE_URL = "postgresql+psycopg2://postgres:GamerZ0ne@localhost:5432/bunker_game"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    user_id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)

class Room(Base):
    __tablename__ = "rooms"
    room_id = Column(String(10), primary_key=True)
    host_id = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"))
    is_started = Column(Boolean, default=False)
    bunker_card = Column(JSONB, nullable=True)
    disaster_card = Column(JSONB, nullable=True)
    created_at = Column(String, server_default=func.now())
    
    players = relationship("RoomPlayer", back_populates="room", cascade="all, delete-orphan")

class RoomPlayer(Base):
    __tablename__ = "room_players"
    room_id = Column(String(10), ForeignKey("rooms.room_id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    name = Column(String(100), nullable=False)
    character_card = Column(JSONB, nullable=True)
    abilities = Column(JSONB, default=list)
    used_abilities = Column(JSONB, default=list)
    is_alive = Column(Boolean, default=True)
    
    room = relationship("Room", back_populates="players")

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def cleanup_old_data(db: Session):
    """Удаляет комнаты и пользователей старше 24 часов"""
    cutoff_time = datetime.utcnow() - timedelta(hours=24)

    old_rooms = db.query(Room).filter(Room.created_at < cutoff_time).all()
    deleted_rooms = len(old_rooms)
    for room in old_rooms:
        db.delete(room)
    
    active_user_ids = db.query(RoomPlayer.user_id).distinct().all()
    active_user_ids = [uid[0] for uid in active_user_ids]
    
    if active_user_ids:
        old_users = db.query(User).filter(User.user_id.notin_(active_user_ids)).all()
    else:
        old_users = db.query(User).all()
    
    deleted_users = len(old_users)
    for user in old_users:
        db.delete(user)
    
    db.commit()
    return {"deleted_rooms": deleted_rooms, "deleted_users": deleted_users}

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        result = cleanup_old_data(db)
        if result['deleted_rooms'] > 0 or result['deleted_users'] > 0:
            print(f"Автоматическая очистка при старте: удалено комнат: {result['deleted_rooms']}, пользователей: {result['deleted_users']}")
        else:
            print("Старые данные не найдены")
    finally:
        db.close()
    
    async def periodic_cleanup():
        while True:
            await asyncio.sleep(3600)
            db = SessionLocal()
            try:
                result = cleanup_old_data(db)
                if result['deleted_rooms'] > 0 or result['deleted_users'] > 0:
                    print(f"Периодическая очистка: удалено комнат: {result['deleted_rooms']}, пользователей: {result['deleted_users']}")
            finally:
                db.close()
    
    task = asyncio.create_task(periodic_cleanup())
    yield
    task.cancel()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALL_ABILITIES = [
    "сменить себе профессию", "сменить себе фобию", "сменить себе хобби",
    "сменить себе здоровье", "сменить себе багаж", "изменить профессию любого игрока",
    "изменить фобию любого игрока", "изменить хобби любого игрока", "изменить здоровье любого игрока",
    "изменить багаж любого игрока", "воскресить любого игрока", "сменить проффесии всех игроков",
    "уменьшить бункер на 1", "увеличить бункер на 1", "бункер находится около пресного озера",
    "бункер находится в лесу", "у бункера есть гараж и машина", "в бункере оказывается инопланетянин",
    "поменяться картой проффесия с любым игроком", "поменяться картой фобия с любым игроком",
    "поменяться картой состояние здоровья с любым игроком", "поменяться картой багаж с любым игроком",
    "поменяться картой хобби с любым игроком", "поменяться картой черта характера с любым игроком"
]

# Классификация способностей
ABILITY_TYPES = {
    # Класс 1.1: На себя
    "сменить себе профессию": "self",
    "сменить себе фобию": "self",
    "сменить себе хобби": "self",
    "сменить себе здоровье": "self",
    "сменить себе багаж": "self",
    
    # Класс 1.2: На бункер
    "рядом есть ещё один бункер, в котором есть 2 плодовитых мужчин": "bunker",
    "рядом есть ещё один бункер, в котором есть 2 плодовитых женщины": "bunker",
    "бункер находится около пресного озера": "bunker",
    "бункер находится в лесу": "bunker",
    "у бункера есть гараж и машина": "bunker",
    "в бункере оказывается инопланетянин": "bunker",
    "рядом с вашим бункером находиться враждебный бункер, в который вы попадаете и будете мстить": "bunker",
    "украсть все запасы еды и воды из бункера(никто не сможет помешать этому)": "bunker",
    "украсть все предметы(кроме еды и воды) из бункера(никто не сможет помешать этому)": "bunker",
    "уменьшить бункер на 1": "bunker",
    "увеличить бункер на 1": "bunker",
    
    # Класс 1.3: На всех
    "сменить проффесии всех игроков": "all_players",
    "в следующем ходу все игроки раскрывают выбранную вами характеристику": "all_players",
    
    # Класс 2: На другого игрока
    "изменить профессию любого игрока": "target_player",
    "изменить фобию любого игрока": "target_player",
    "изменить хобби любого игрока": "target_player",
    "изменить здоровье любого игрока": "target_player",
    "изменить багаж любого игрока": "target_player",
    "воскресить любого игрока": "target_player",
    "вылечить бесплодие любого игрока": "target_player",
    "омолодить любого игрока на 15 лет если он старше 30": "target_player",
    "защита на 1 ход любого игрока от голосования (его нельзя выгнать в этом коне)": "target_player",
    
    # Класс 3: Обмен
    "поменяться картой \"состояние здоровья\" с любым игроком": "swap",
    "поменяться картой \"проффесия\" с любым игроком": "swap",
    "поменяться картой \"биологические данные\" с любым игроком": "swap",
    "поменяться картой \"фобия\" с любым игроком": "swap",
    "поменяться картой \"багаж\" с любым игроком": "swap",
    "поменяться картой \"хобби\" с любым игроком": "swap",
    "поменяться картой \"черта характера\" с любым игроком": "swap",
    # Старые варианты написания (из ALL_ABILITIES)
    "поменяться картой проффесия с любым игроком": "swap",
    "поменяться картой фобия с любым игроком": "swap",
    "поменяться картой состояние здоровья с любым игроком": "swap",
    "поменяться картой багаж с любым игроком": "swap",
    "поменяться картой хобби с любым игроком": "swap",
    "поменяться картой черта характера с любым игроком": "swap",
    
    # Класс 4: Раскрытие (офлайн)
    "раскрыть любую характеристику любого игрока (твой выбор)": "reveal",
    "раскрыть случайную характеристику любого игрока (его выбор)": "reveal",
    
    # Класс 5: Позиционные
    "карта врага (если человек слева от тебя попадает в бункер - ты нет)": "positional",
    "карта врага (если человек справа от тебя попадает в бункер - ты нет)": "positional",
    "карта врага (если человек напротив тебя попадает в бункер - ты нет)": "positional",
    "Карта друга (если человек напротив тебя не попадает в бункер - ты тоже)": "positional",
    "Карта друга (если человек слева от тебя не попадает в бункер - ты тоже)": "positional",
    "Карта друга (если человек после тебя не попадает в бункер - ты тоже)": "positional",
}

def get_current_user_id(x_user_id: str = Header(..., alias="X-User-Id")):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Не указан заголовок X-User-Id")
    return x_user_id

def get_room_and_player(room_id: str, user_id: str, db: Session):
    room = db.query(Room).filter(Room.room_id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    
    player = db.query(RoomPlayer).filter(
        RoomPlayer.room_id == room_id, 
        RoomPlayer.user_id == user_id
    ).first()
    if not player:
        raise HTTPException(status_code=403, detail="Вы не состоите в этой комнате")
        
    return room, player

def require_host(room: Room, user_id: str):
    if room.host_id != user_id:
        raise HTTPException(status_code=403, detail="Только создатель комнаты может выполнять это действие")

def update_character_field(character_card: list, field_key: str, new_value: str) -> list:
    """Обновляет значение поля в character_card (формат list)"""
    if not isinstance(character_card, list):
        character_card = []
    
    for item in character_card:
        if isinstance(item, dict) and item.get("key") == field_key:
            item["value"] = new_value
            return character_card
    
    # Если поле не найдено, добавляем его
    character_card.append({"key": field_key, "value": new_value})
    return character_card

def get_character_field(character_card: list, field_key: str, default=None):
    """Получает значение поля из character_card (формат list)"""
    if not isinstance(character_card, list):
        return default
    
    for item in character_card:
        if isinstance(item, dict) and item.get("key") == field_key:
            return item.get("value", default)
    
    return default

class RoomActionRequest(BaseModel):
    user_name: str

class UseAbilityRequest(BaseModel):
    ability_text: str
    target_player_id: Optional[str] = None

@app.get("/player_gen/")
def player_gen(): return Generator_player.generate_card()
@app.get("/bunker_gen/")
def bunker_gen(): return Bunker_generator.generate_card()
@app.get("/disaster_gen/")
def disaster_gen(): return Catastophe_gen.generate_card()
@app.get("/prof_gen/")
def prof_gen(): return Generator_prof.generate_card()
@app.get("/char_gen/")
def char_gen(): return Generator_char.generate_card()
@app.get("/hobbie_gen/")
def hobbie_gen(): return Generator_hob.generate_card()
@app.get("/health_gen/")
def health_gen(): return Generator_health.generate_card()
@app.get("/phobia_gen/")
def phobia_gen(): return Generator_phobia.generate_card()

class UserLoginData(BaseModel):
    name: str

@app.post("/api/set_name")
async def receive_user_name(data: UserLoginData, db: Session = Depends(get_db)):
    user_id = generate_user_id(data.name)
    
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        user = User(user_id=user_id, name=data.name)
        db.add(user)
        db.commit()
    
    return {"status": "success", "name": data.name, "id": user_id}

@app.post("/api/create_room")
async def create_room(request: RoomActionRequest, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    room_id = str(uuid.uuid4())[:8].upper()
    
    new_room = Room(room_id=room_id, host_id=user_id, is_started=False)
    db.add(new_room)
    
    new_player = RoomPlayer(room_id=room_id, user_id=user_id, name=request.user_name, is_alive=True)
    db.add(new_player)
    db.commit()
    
    return {"room_id": room_id, "status": "success"}

@app.post("/api/join_room/{room_id}")
async def join_room(room_id: str, request: RoomActionRequest, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.room_id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    if room.is_started:
        raise HTTPException(status_code=400, detail="Игра уже началась")
    
    player = db.query(RoomPlayer).filter(RoomPlayer.room_id == room_id, RoomPlayer.user_id == user_id).first()
    if not player:
        new_player = RoomPlayer(room_id=room_id, user_id=user_id, name=request.user_name, is_alive=True)
        db.add(new_player)
        db.commit()
        
    return {"status": "success"}

@app.post("/api/start_game/{room_id}")
async def start_game(room_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    room, player = get_room_and_player(room_id, user_id, db)
    require_host(room, user_id)
    
    if room.is_started:
        return {"status": "already_started"}
    
    room.bunker_card = Bunker_generator.generate_card()
    room.disaster_card = Catastophe_gen.generate_card()
    room.is_started = True
    
    players = db.query(RoomPlayer).filter(RoomPlayer.room_id == room_id).all()
    for p in players:
        p.character_card = Generator_player.generate_card()
        p.abilities = random.sample(ALL_ABILITIES, min(2, len(ALL_ABILITIES)))
        
    db.commit()
    return {"status": "success"}

@app.get("/api/game_state/{room_id}")
async def get_game_state(room_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    room, player = get_room_and_player(room_id, user_id, db)
    
    all_players = db.query(RoomPlayer).filter(RoomPlayer.room_id == room_id).all()
    
    return {
        "room_id": room.room_id,
        "host_id": room.host_id,
        "is_started": room.is_started,
        "bunker_card": room.bunker_card,
        "disaster_card": room.disaster_card,
        "my_character": player.character_card,
        "my_abilities": [
            {
                "text": ab, 
                "used": ab in (player.used_abilities or []),
                "type": ABILITY_TYPES.get(ab, "unknown")
            } 
            for ab in (player.abilities or [])
        ],
        "players": [{"id": p.user_id, "name": p.name, "is_alive": p.is_alive, "is_host": (p.user_id == room.host_id)} for p in all_players]
    }

@app.post("/api/use_ability/{room_id}")
async def use_ability(room_id: str, request: UseAbilityRequest, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    room, player = get_room_and_player(room_id, user_id, db)
    
    if request.ability_text not in (player.abilities or []):
        raise HTTPException(status_code=400, detail="Способность недоступна")
    if request.ability_text in (player.used_abilities or []):
        raise HTTPException(status_code=400, detail="Способность уже использована")
    
    ability = request.ability_text
    
    if "сменить себе" in ability:
        if "профессию" in ability:
            new_prof = Generator_prof.generate_card()
            player.character_card = update_character_field(player.character_card, "Работа", new_prof.get("Работа", new_prof.get("Профессия", "")))
            player.character_card = update_character_field(player.character_card, "Стаж", new_prof.get("Стаж", ""))
        elif "фобию" in ability:
            new_phobia = Generator_phobia.generate_card()
            player.character_card = update_character_field(player.character_card, "Фобия", new_phobia.get("Фобия", ""))
        elif "хобби" in ability:
            new_hob = Generator_hob.generate_card()
            player.character_card = update_character_field(player.character_card, "Хобби", new_hob.get("Хобби", ""))
        elif "здоровье" in ability:
            new_health = Generator_health.generate_card()
            player.character_card = update_character_field(player.character_card, "Диагноз", new_health.get("Диагноз", ""))
            player.character_card = update_character_field(player.character_card, "Прогресс", new_health.get("Прогресс", ""))
        elif "багаж" in ability:
            new_char = Generator_player.generate_card()
            player.character_card = update_character_field(player.character_card, "Багаж", get_character_field(new_char, "Багаж", ""))
            
    elif "любого игрока" in ability and request.target_player_id:
        target = db.query(RoomPlayer).filter(RoomPlayer.room_id == room_id, RoomPlayer.user_id == request.target_player_id).first()
        if target:
            if "профессию" in ability:
                new_prof = Generator_prof.generate_card()
                target.character_card = update_character_field(target.character_card, "Работа", new_prof.get("Работа", new_prof.get("Профессия", "")))
                target.character_card = update_character_field(target.character_card, "Стаж", new_prof.get("Стаж", ""))
            elif "фобию" in ability:
                new_phobia = Generator_phobia.generate_card()
                target.character_card = update_character_field(target.character_card, "Фобия", new_phobia.get("Фобия", ""))
            elif "хобби" in ability:
                new_hob = Generator_hob.generate_card()
                target.character_card = update_character_field(target.character_card, "Хобби", new_hob.get("Хобби", ""))
            elif "здоровье" in ability:
                new_health = Generator_health.generate_card()
                target.character_card = update_character_field(target.character_card, "Диагноз", new_health.get("Диагноз", ""))
                target.character_card = update_character_field(target.character_card, "Прогресс", new_health.get("Прогресс", ""))
            elif "багаж" in ability:
                new_char = Generator_player.generate_card()
                target.character_card = update_character_field(target.character_card, "Багаж", get_character_field(new_char, "Багаж", ""))
            elif "воскресить" in ability:
                target.is_alive = True

    elif "поменяться" in ability and request.target_player_id:
        target = db.query(RoomPlayer).filter(RoomPlayer.room_id == room_id, RoomPlayer.user_id == request.target_player_id).first()
        if target:
            if "професия" in ability or "проффесия" in ability:
                p_prof = get_character_field(player.character_card, "Работа")
                p_stazh = get_character_field(player.character_card, "Стаж")
                t_prof = get_character_field(target.character_card, "Работа")
                t_stazh = get_character_field(target.character_card, "Стаж")
                player.character_card = update_character_field(player.character_card, "Работа", t_prof)
                player.character_card = update_character_field(player.character_card, "Стаж", t_stazh)
                target.character_card = update_character_field(target.character_card, "Работа", p_prof)
                target.character_card = update_character_field(target.character_card, "Стаж", p_stazh)
            elif "фобия" in ability:
                p_phobia = get_character_field(player.character_card, "Фобия")
                t_phobia = get_character_field(target.character_card, "Фобия")
                player.character_card = update_character_field(player.character_card, "Фобия", t_phobia)
                target.character_card = update_character_field(target.character_card, "Фобия", p_phobia)
            elif "хобби" in ability:
                p_hobbie = get_character_field(player.character_card, "Хобби")
                t_hobbie = get_character_field(target.character_card, "Хобби")
                player.character_card = update_character_field(player.character_card, "Хобби", t_hobbie)
                target.character_card = update_character_field(target.character_card, "Хобби", p_hobbie)
            elif "здоровье" in ability or "состояние здоровья" in ability:
                p_diagnoz = get_character_field(player.character_card, "Диагноз")
                p_progress = get_character_field(player.character_card, "Прогресс")
                t_diagnoz = get_character_field(target.character_card, "Диагноз")
                t_progress = get_character_field(target.character_card, "Прогресс")
                player.character_card = update_character_field(player.character_card, "Диагноз", t_diagnoz)
                player.character_card = update_character_field(player.character_card, "Прогресс", t_progress)
                target.character_card = update_character_field(target.character_card, "Диагноз", p_diagnoz)
                target.character_card = update_character_field(target.character_card, "Прогресс", p_progress)
            elif "багаж" in ability:
                p_bag = get_character_field(player.character_card, "Багаж")
                t_bag = get_character_field(target.character_card, "Багаж")
                player.character_card = update_character_field(player.character_card, "Багаж", t_bag)
                target.character_card = update_character_field(target.character_card, "Багаж", p_bag)
                
    elif "бункер" in ability or "всех" in ability:
        b_card = room.bunker_card or {}
        if "увеличить" in ability:
            b_card["Размер бункера"] = b_card.get("Размер бункера", 100) + 50
        elif "уменьшить" in ability:
            b_card["Размер бункера"] = max(50, b_card.get("Размер бункера", 100) - 50)
        elif "лесу" in ability:
            b_card["Расположение"] = "В лесу"
        elif "озера" in ability:
            b_card["Расположение"] = "Около пресного озера"
        elif "гараж" in ability:
            b_card["Дополнительно"] = "Есть гараж и машина"
        elif "инопланетянин" in ability:
            b_card["Дополнительно"] = "В бункере находится инопланетянин"
        elif "профессии всех" in ability:
            all_players = db.query(RoomPlayer).filter(RoomPlayer.room_id == room_id).all()
            for p in all_players:
                new_prof = Generator_prof.generate_card()
                p.character_card = update_character_field(p.character_card, "Работа", new_prof.get("Работа", new_prof.get("Профессия", "")))
                p.character_card = update_character_field(p.character_card, "Стаж", new_prof.get("Стаж", ""))
        room.bunker_card = b_card
    
    used = player.used_abilities or []
    used.append(request.ability_text)
    player.used_abilities = used
    
    db.commit()
    return {"status": "success", "message": f"Способность '{ability}' использована"}

@app.post("/api/kick_player/{room_id}/{target_id}")
async def kick_player(room_id: str, target_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    room, _ = get_room_and_player(room_id, user_id, db)
    require_host(room, user_id)
    
    target = db.query(RoomPlayer).filter(RoomPlayer.room_id == room_id, RoomPlayer.user_id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Игрок не найден")
    
    target.is_alive = False
    db.commit()
    return {"status": "success", "message": f"Игрок {target.name} кикнут"}