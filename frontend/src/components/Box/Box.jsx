import "./Box.css"

function Box({ data, variant }) {

    const classNames = `${variant}`

    return (
        <div className={classNames}>
            {data?.history?.length > 0 ? (
                <div className="Boxcontent">
                    {data.history.map((item, index) => {
                        const nextItem = data.history[index + 1];
                        const isLastInGroup =
                            !nextItem || nextItem.groupId !== item.groupId;
                        return (
                            <div key={index}>
                                <h2>
                                    {item.type} {item.index && `(${item.index})`}
                                </h2>
                                {Object.entries(item.data).map(([k, v]) => (
                                    <div key={k}>
                                        <b>{k}:</b> {String(v)}
                                    </div>
                                ))}
                                {isLastInGroup && <hr />}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="boxPlaceholder">
                    Здесь появятся данные
                </p>
            )}
        </div>
    )
}

export default Box