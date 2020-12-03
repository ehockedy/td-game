export class BaseComponent {
    constructor(sprite_handler, containerName) {
        this.sprite_handler = sprite_handler
        this.container = new PIXI.Container();
        this.containerName = containerName
        this.container.name = this.containerName
    }

    registerContainer() {
        this.sprite_handler.registerContainer(this.container)
    }

    _setContainerInteraction(container, value) {
        container.children.forEach((child) => {
            child.interactive = value
            child.buttonMode = value
        })
    }

    startInteraction() {
        this._setContainerInteraction(this.container, true)
    }

    stopInteraction() {
        this._setContainerInteraction(this.container, false)
    }
}
