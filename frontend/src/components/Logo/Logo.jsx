import "./Logo.css"


function Logo({alt = "Logo", size = 500}) {
    return(
        <div className="logo">
            <img
            className="logo_img"
            src={"/Frame 6.png"}
            alt={alt}
            style={{width: size}}
            />

        </div>
    )

}

export default Logo;