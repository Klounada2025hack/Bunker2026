import "./Button.css"

function Button({ text, onClick, variant, active }) {

    const classNames = `button ${variant} ${active ? "active" : ""}`

    return (
        <button
            className={classNames}
            onClick={onClick}
        >
            {text}
        </button>
    )
}

export default Button