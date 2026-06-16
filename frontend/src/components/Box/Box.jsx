import "./Box.css"

function Box({ title, children, variant }) {
    const classNames = variant ? `box ${variant}` : "box";

    return (
        <div className={classNames}>
            {title && <h3 className="box-title" style={{ marginBottom: '15px', textAlign: 'center', color: '#f1c40f' }}>{title}</h3>}
            
            <div className="Boxcontent">
                {children ? (
                    children
                ) : (
                    <p className="boxPlaceholder">
                        Здесь появятся данные
                    </p>
                )}
            </div>
        </div>
    )
}

export default Box