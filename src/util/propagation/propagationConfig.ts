export interface IssuePropagationConfig {
    schemas: Record<string, PropagatedIssueSchema>;
    rules: PropagationRule[];
}

export interface PropagatedIssueSchema {
    /**
     * If true, use the template of the source issue
     * If a string, use the template with the given id
     */
    template: string | true;
    /**
     * If true, use the type of the source issue
     * If a string, use the type with the given id
     */
    type: string | true;
    /**
     * If true, use the state of the source issue
     * If a string, use the state with the given id
     */
    state: string | true;
    /**
     * If true, use the title of the source issue
     * If a string, use the title with the given id
     * If undefined, the user needs to enter a title
     */
    title: string | true | undefined;
    /**
     * Relations to the source issue that should be created
     * If undefined, no relations are created
     */
    relationToSource?: PropagationIssueRelation;
    /**
     * The characteristics of the propagated issue
     */
    characteristics: string[];
}

export interface PropagationIssueRelation {
    /**
     * The type of the relation to use
     */
    type: string;
    /**
     * The direction of the relation
     */
    direction: "incoming" | "outgoing";
}

export interface PropagationRule {
    /**
     * This rule only applies to the following issues
     */
    filterIssue: IssueFilter,
    /**
     * This rule only applies to the following relations
     */
    filterRelation: RelationFilter,
    /**
     * This rule only applies to issues on the following components
     */
    filterStartComponent: ComponentFilter,
    /**
     * This rule only propagates issues to the following components
     */
    filterEndComponent: ComponentFilter,
    /**
     * Should the issue propagate with the relation direction, or against it
     */
    propagationDirection: "forward" | "backward" | "both",
    /**
     * The new issue will be created on the component with the given schema
     */
    newIssueSchema: string,
    metadata?: Record<string, any>
}

export interface IssueFilter {
    type?: string[];
    state?: string[];
    template?: string[];
    characteristics?: string[];
}

export interface RelationFilter {
    template?: string[];
}

export interface ComponentFilter {
    name?: string;
    template?: string[];
}