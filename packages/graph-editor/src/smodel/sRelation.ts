import { Selectable } from "sprotty";
import { RelationStyle } from "../gropiusModel";
import { Relation } from "../model/relation";
import { SSelectable } from "./sSelectable";
import { Bounds, Point } from "sprotty-protocol";
import { SIssueAffected } from "./sIssueAffected";
import { LineEngine } from "../line/engine/lineEngine";

export class SRelation extends SSelectable implements Relation, Selectable {
    declare type: typeof Relation.TYPE;
    start?: string | Point;
    end?: string | Point;
    style!: RelationStyle;
    selected = false;
    path!: RelationPath | null;
    propagationModeActive!: boolean | null;

    constructor() {
        super();
        this.cachedProperty("path", () => this.calculatePath());
    }

    get contextMenuPos(): Point {
        const path = this.path;
        if (path == null) {
            return Point.ORIGIN;
        } else {
            return path.end;
        }
    }

    private calculatePath(): RelationPath | null {
        if (this.start == undefined || this.end == undefined) {
            return null;
        }
        let initialStartPos: Point;
        let initialEndPos: Point;
        if (typeof this.start === "string") {
            const start = this.root.index.getById(this.start) as SIssueAffected;
            initialStartPos = Bounds.center(start.shape.bounds);
        } else {
            initialStartPos = this.start;
        }
        if (typeof this.end === "string") {
            const end = this.root.index.getById(this.end) as SIssueAffected;
            initialEndPos = Bounds.center(end.shape.bounds);
        } else {
            initialEndPos = this.end;
        }
        let startPoint: Point;
        let endPoint: Point;
        if (typeof this.start === "string") {
            const start = this.root.index.getById(this.start) as SIssueAffected;
            const startShape = start.shape;
            const startPos = LineEngine.DEFAULT.projectPoint(initialEndPos, startShape.outline).pos;
            startPoint = LineEngine.DEFAULT.getPoint(startPos, 0, startShape.outline);
        } else {
            startPoint = initialStartPos;
        }
        if (typeof this.end === "string") {
            const end = this.root.index.getById(this.end) as SIssueAffected;
            const endShape = end.shape;
            const endPos = LineEngine.DEFAULT.projectPoint(initialStartPos, endShape.outline).pos;
            endPoint = LineEngine.DEFAULT.getPoint(endPos, 0, endShape.outline);
        } else {
            endPoint = initialEndPos;
        }
        return { start: startPoint, end: endPoint };
    }
}

interface RelationPath {
    start: Point;
    end: Point;
}
