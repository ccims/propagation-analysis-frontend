export interface PropagatedIssue extends Omit<TemplatedNode, "id"> {
    id?: string;
    ref: string | number;
    propagations: (string | number)[];
    state: string;
    type: string;
    template: string;
    title?: string;
    componentsAndInterfaces: string[];
    characteristics: string[];
}

export interface TemplatedNode {
    id: string;
    template: string;
    templatedFields: Record<string, any>;
}

export interface Component extends TemplatedNode {
    name: string;
    interfaces: Interface[];
    intraComponentDependencySpecifications: IntraComponentDependencySpecification[];
}

export interface Interface extends TemplatedNode {
    name: string;
    component: string;
}

export interface IntraComponentDependencySpecification {
    id: string;
    name: string;
    incoming: string[];
    outgoing: string[];
    type: string | undefined;
}

export interface Relation extends TemplatedNode {
    from: string;
    to: string;
}

export interface PropagationContext {
    components: Component[];
    relations: Relation[];
    issues: PropagatedIssue[];
}
