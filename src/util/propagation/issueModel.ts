export interface PropagatedIssue {
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
    templatedFields: Record<string, any>
}

export interface Component {
    id: string;
    name: string;
    template: string;
    interfaces: Interface[];
    intraComponentDependencySpecifications: IntraComponentDependencySpecification[];
}

export interface Interface {
    id: string;
    name: string;
    template: string;
    component: string;
}

export interface IntraComponentDependencySpecification {
    id: string;
    name: string;
    incoming: string[];
    outgoing: string[];
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
