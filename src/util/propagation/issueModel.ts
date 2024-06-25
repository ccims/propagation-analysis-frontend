export interface PropagatedIssue {
    id?: string;
    ref: string | number;
    propagations: (string | number)[]
    state: string;
    type: string;
    template: string;
    title?: string;
    components: string[];
    characteristics: string[];
}

export interface Component {
    id: string;
    name: string;
    template: string;
}

export interface Relation {
    id: string;
    template: string;
    from: string;
    to: string;
}

export interface PropagationContext {
    components: Component[];
    relations: Relation[];
    issues: PropagatedIssue[];
}