import uuid

def generate_user_id(name: str) -> str:
    user_id = str(uuid.uuid4())
    print(f"Сгенерирован ID {user_id} для имени {name}")
    return user_id