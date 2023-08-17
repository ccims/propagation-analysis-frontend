import { Bounds, BoundsAware, Dimension, Point } from "sprotty-protocol";
import { Label } from "../model/label";
import { SElement } from "./sElement";

export class SLabel extends SElement implements Label, BoundsAware {
    declare type: typeof Label.TYPE;
    text!: string;
    position: Point = Point.ORIGIN;
    size: Dimension = { width: 1, height: 1 };

    get bounds(): Bounds {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.size.width,
            height: this.size.height
        };
    }

    set bounds(newBounds: Bounds) {
        this.position = {
            x: newBounds.x,
            y: newBounds.y
        };
        this.size = {
            width: newBounds.width,
            height: newBounds.height
        };
    }
}
