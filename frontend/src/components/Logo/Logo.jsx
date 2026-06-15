import "./Logo.css"


function Logo({alt = "Logo", size = 140}) {
    return(
        <div className="logo">
            <img
            className="logo_img"
            src={"/image 4.png"}
            alt={alt}
            style={{width: size}}
            />

        </div>
    )

}

export default Logo;