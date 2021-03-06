export class BaseComponent extends PIXI.Container {
    constructor(name="") {
        super()
        this.name = name
    }

    tick() {}

    _setContainerInteraction(container, value) {
        container.children.forEach((child) => {
            child.interactive = value
            child.buttonMode = value
        })
    }

    startInteraction() {
        this._setContainerInteraction(this, true)
    }

    stopInteraction() {
        this._setContainerInteraction(this, false)
    }

    hide() {
        this.visible = false
    }

    show() {
        this.visible = true
    }

    toggle() {
        this.visible = !this.visible
    }
}
