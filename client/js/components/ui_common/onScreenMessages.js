import { boldTextStyle, plainTextStyle, COLOURS } from "./style.js"

export class OnScreenMessage extends PIXI.Container {
    constructor (x, y, message="", fontSize=20) {
        super()
        
        this.x = x
        this.y = y

        this.text = new PIXI.Text(message, boldTextStyle(COLOURS.WHITE, fontSize));
        this.text.anchor.set(0.5)
        this.text.alpha = 0
        this.addChild(this.text)
    }

    updateText(newMessage) {
        this.text.text = newMessage
    }

    fadeIn(time_ms) {
        let alphaUpdate = setInterval(()=>{
            this.text.alpha = Math.min(1, this.text.alpha+0.05)
        }, time_ms/20)

        setTimeout(()=>{
            clearInterval(alphaUpdate)
            this.text.alpha = 1
        }, time_ms + 100)  // Add on 100 just to no overlap
    }

    fadeOut(time_ms) {
        let alphaUpdate = setInterval(()=>{
            this.text.alpha = Math.max(0, this.text.alpha-0.05)
        }, time_ms/20)

        setTimeout(()=>{
            clearInterval(alphaUpdate)
            this.text.alpha = 0
        }, time_ms + 100)  // Add on 100 just to no overlap
    }

    fadeInThenOut(timePerTransition_ms, timeBetweenTransitions_ms=2000) {
        this.fadeIn(timePerTransition_ms)

        setTimeout(()=>{
            this.fadeOut(timePerTransition_ms)
        }, timePerTransition_ms + timeBetweenTransitions_ms)
    }
}