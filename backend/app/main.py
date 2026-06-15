from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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
    # Вызываем функцию из name_to_id
    user_id = generate_user_id(data.name)
    
    # Здесь можно использовать user_id как нужно
    # Потом добавишь сохранение в БД
    
    return {
        "status": "success",
        "name": data.name,
        "id": user_id
    }