import "./Logo.css"


function Logo({alt = "Logo", size = 140}) {
    return(
        <div classname="logo">
            <img
            classname="logo_img"
            src={"/image 4.png"}
            alt={alt}
            style={{width: size}}
            />

        </div>
    )

}

export default Logo;