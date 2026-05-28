import "../pages/container.css"
import { useState } from "react";
import Button from "../components/Button/button";
import Box from "../components/Box/Box";
import Smallbox from "../components/Box/smallbox";
import Button_reRoll from "../components/Button_reRoll/Button_reRoll";

function Authorization(){
    const [Name,setName] = useState("");

    return(

<div className="layout">
    <div>
        <Button_reRoll
                variant="input"
                value={Name}
                placeholder="Введите Свое имя"
                onChange={(e) => setName(e.target.value)}
            />
    </div>
</div>
);
}

export default Authorization

