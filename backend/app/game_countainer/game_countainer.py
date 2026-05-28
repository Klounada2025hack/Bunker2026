from app.bunker import Bunker_generator
from app.player import Generator_player
from app.catastrophe import Catastophe_gen
class Game_countainer:
    def __init__(self, num_player):
        self.Bunker_card = []
        self.Catastrophe = []
        self.Player = []
        self.num_player = num_player

    def game_setup(self):
        for i in range(self.num_player):
            players_cards = Generator_player.generate_card()
            self.Player.append(players_cards)
            
        Bunker_card = Bunker_generator.generate_card()
        self.Bunker_card.append(Bunker_card)
        
        Catastrophe_card = Catastophe_gen.generate_card()
        self.Catastrophe.append(Catastrophe_card)
        


