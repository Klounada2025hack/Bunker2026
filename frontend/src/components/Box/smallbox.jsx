import "./Box.css"

function Smallbox({variant,children}) {
    const classNams = `${variant}`
    return(
        <div className={classNams}>
            {children}

        </div>
    )
}

export default Smallbox