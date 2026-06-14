import "../pages/container.css"
import Button from "../components/Button/button";
import { player_gen, bunker_gen, disaster_gen, hobbie_gen, prof_gen,health_gen,phobia_gen,} from "../api/game_api";
import { useState } from "react";
import Box from "../components/Box/Box";
import Smallbox from "../components/Box/smallbox";
import Button_reRoll from "../components/Button_reRoll/Button_reRoll";

function Homepage(){

    const [num_players,setNumPlayers] = useState(null);
    const [activeButton, setActiveButton] = useState(null);
    const [history, setHistory] = useState([]);

    const handleChange = (e) => {  
        let value = e.target.value;
        if (value === "") {
            setNumPlayers(null);
            return;
        }
        value = Number(value);
        if (value < 1) value = 1;
        if (value > 20) value = 20;
        setNumPlayers(value);
    };

    async function again(count, generator, type) {
        const results = [];
        const groupId = Date.now();
        for (let i = 0; i < count; i++) {
            const data = await generator();
            results.push({
                type,
                data,
                index: i + 1,
                groupId
            });
        }
        setHistory(prev => [...prev, ...results]);
    }


    return(
        
    <div className="layoutHome">
        <div className="Container">
            <Button_reRoll
                variant="input"
                min={1}
                max={20}
                value={num_players || ""}
                onChange={handleChange}
                placeholder="Введите количество игроков"
            
            />
            <Button 
                text="Карточка игрока" 
                variant="card"
                onClick={async () => {
                    const data = await player_gen()
                    setHistory(prev => [
                        ...prev,
                        { type: "Игрок", data, groupId: Date.now() }
                    ])
                }}
            />
            <div className="Containeractive">
                <Button
                    text="Рерол"
                    variant="small"
                    active={activeButton === "reroll"}
                    onClick={async () => {
                        setActiveButton(activeButton === "reroll" ? null : "reroll")                        
                    }}
                />
                <Button
                    text="Рерол всех"
                    variant="small"
                    active={activeButton === "rerollAll"}
                    onClick={async () => {
                        setActiveButton(activeButton === "rerollAll" ? null : "rerollAll")
                    }}
                />

            </div>
                <Button
                    text="Карточка бункера"
                    variant="card"
                    onClick={async () => {
                        const data = await bunker_gen()
                        setHistory(prev => [
                            ...prev,
                            { type: "Бункер", data, groupId: Date.now() }
                        ])
                    }}
                />

                <Button
                    text="Карточку катастрофы"
                    variant="card"
                    onClick={async () => {
                        const data = await disaster_gen()
                        setHistory(prev => [
                            ...prev,
                            { type: "Катастрофа", data, groupId: Date.now() }
                        ])
                    }}
                />
        </div>
            <div className="Containerbox">
                <Box
                    variant="box"
                    data={{ history }}
                />
            
            <Smallbox
                variant="smallbox"
                >

                <div className="ContainerButton">
                <Button_reRoll 
                    text="Профессия" 
                    variant="smallreroll"
                    onClick={async () => { 
                        const count = activeButton === "rerollAll" ? (num_players || 1) : 1;
                        await again(count, prof_gen, "Рерол профессии");
                        
                    }}
                />  

                <Button_reRoll 
                    text="Здоровье" 
                    variant="smallreroll"
                    onClick={async () => {
                        const count = activeButton === "rerollAll" ? (num_players || 1) : 1;
                        await again(count, health_gen, "Рерол здоровья");
                    }}
                />  

                <Button_reRoll 
                    text="Хобби" 
                    variant="smallreroll"
                    onClick={async () => {
                        const count = activeButton === "rerollAll" ? (num_players || 1) : 1;
                        await again(count, hobbie_gen, "Рерол хобби");                  
                    }}
                />  

                <Button_reRoll 
                    text="Фобия" 
                    variant="smallreroll"
                    onClick={async () => {
                        const count = activeButton === "rerollAll" ? (num_players || 1) : 1;
                        await again(count, phobia_gen, "Рерол фобии");                    
                    }}
                />  
                </div>
            </Smallbox>
        </div>
    </div>      
    )
}
export default Homepage