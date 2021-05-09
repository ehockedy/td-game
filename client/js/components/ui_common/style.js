
export function generateStyle(tint, fontSize=48) {
    return {
        "dropShadow": false,
        "dropShadowAngle": 0.7,
        "fill": tint,
        "fontFamily": "\"Trebuchet MS\", Helvetica, sans-serif",
        "fontSize": fontSize,
        "fontStyle": "normal",
        "fontVariant": "small-caps",
        "letterSpacing": 1,
        "strokeThickness": Math.ceil(fontSize/10)
    }
}

export let aimColour = "0xDD3333"
export let upgradeColour = "0x229933"
export let sellColour = "0xDDAA11"
export let towerInfoColour = "0xAABB99"