import {
    MouseListener,
    SModelElementImpl,
    SModelRootImpl,
    findParentByFeature,
    isSelectable,
    isViewport,
    moveFeature
} from "sprotty";
import { Action, Point, hasOwnProperty } from "sprotty-protocol";
import { MoveHandler } from "./moveHandler";
import { Component } from "../../model/component";
import { Interface } from "../../model/interface";
import { SComponent } from "../../smodel/sComponent";
import { SInterface } from "../../smodel/sInterface";
import { ElementMoveHandler } from "./elementMoveHandler";
import { SRoot } from "../../smodel/sRoot";
import { SContextMenu } from "../../smodel/sContextMenu";

export class MoveMouseListener extends MouseListener {
    private startPosition?: Point;
    private moveHandler?: MoveHandler;
    private targetElement?: Element;
    private changeRevision = -1;

    override mouseDown(target: SModelElementImpl, event: MouseEvent): Action[] {
        if (event.button === 0) {
            const moveableTarget = findParentByFeature(target, isMovable);
            if (moveableTarget != undefined && !(target instanceof SContextMenu) && (moveableTarget.root as SRoot).propagationMode !== true) {
                this.startPosition = { x: event.pageX, y: event.pageY };
                this.targetElement = event.target as Element | undefined;
            } else {
                this.startPosition = undefined;
                this.targetElement = undefined;
            }
        }
        return [];
    }

    override mouseMove(target: SModelElementImpl, event: MouseEvent): Action[] {
        if (this.startPosition) {
            if (this.moveHandler === undefined) {
                this.moveHandler = this.createHandler(target, this.targetElement);
            }
            const root = target.root as SRoot;
            if (this.moveHandler != undefined && root.changeRevision != this.changeRevision) {
                const translation = this.calculateTranslation(target, event);
                const result = this.moveHandler.generateAction(translation.x, translation.y, false, event);
                this.changeRevision = root.changeRevision;
                return [result];
            }
        }
        return [];
    }

    override mouseUp(target: SModelElementImpl, event: MouseEvent): Action[] {
        return this.commitMove(target, event);
    }

    override mouseEnter(target: SModelElementImpl, event: MouseEvent): Action[] {
        if (event.buttons === 0) {
            return this.commitMove(target, event);
        } else {
            return [];
        }
    }

    private commitMove(target: SModelElementImpl, event: MouseEvent): Action[] {
        if (this.moveHandler === undefined || this.moveHandler === null) {
            this.startPosition = undefined;
            this.moveHandler = undefined;
            return [];
        }
        const translation = this.calculateTranslation(target, event);
        const result = this.moveHandler.generateAction(translation.x, translation.y, true, event);
        this.moveHandler = undefined;
        this.startPosition = undefined;
        return [result];
    }

    private createHandler(target: SModelElementImpl, targetElement?: Element): MoveHandler | undefined {
        const selected = this.getSelectedElements(target.root).filter((element) => {
            return element.type === Component.TYPE || element.type === Interface.TYPE;
        }) as (SComponent | SInterface)[];
        if (selected.length === 0) {
            return undefined;
        }
        const selectedIds = new Set(selected.map((element) => element.id));
        const toMove = selected.filter((element) => {
            if (element.type === Interface.TYPE) {
                return !selectedIds.has(element.parent.id);
            } else {
                return true;
            }
        });
        return new ElementMoveHandler(toMove);
    }

    private calculateTranslation(target: SModelElementImpl, event: MouseEvent): Point {
        if (this.startPosition == undefined) {
            throw new Error("Cannot calculate translation without a start position");
        }
        const zoom = findViewportZoom(target);
        return {
            x: (event.pageX - this.startPosition.x) / zoom,
            y: (event.pageY - this.startPosition.y) / zoom
        };
    }

    private getSelectedElements(root: SModelRootImpl): SModelElementImpl[] {
        return [...root.index.all().filter((child) => isSelectable(child) && child.selected)];
    }
}

function findViewportZoom(element: Readonly<SModelElementImpl>): number {
    const viewport = findParentByFeature(element, isViewport);
    return viewport ? viewport.zoom : 1;
}

function isMovable(element: SModelElementImpl): element is SModelElementImpl {
    return element.hasFeature(moveFeature);
}
