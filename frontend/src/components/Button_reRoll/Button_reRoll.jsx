import "./Button_reRoll.css"

function Button_reRoll(props) {
    const { variant, text, ...rest } = props;

    if (variant === "input") {
        return <input className="inputPlayers" {...rest} />;
    }

    return (
        <button className={variant} {...rest}>
            {text}
        </button>
    );
}

export default Button_reRoll;