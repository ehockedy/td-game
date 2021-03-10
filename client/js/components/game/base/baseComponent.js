export class BaseComponent extends PIXI.Container {
    constructor(name="") {
        super()
        this.name = name

        // A list of the observers to emit an event to if the component is interacted with
        this.observers = []
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

    subscribe(observer) {
        this.observers.push(observer)
    }

    unsubscribe(observer) {
        this.observers = this.observers.filter(item => item !== observer)
    }
}
