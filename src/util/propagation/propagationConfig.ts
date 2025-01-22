import { RulesLogic } from "json-logic-js";

export interface IssuePropagationConfig {
    schemas: Record<string, PropagatedIssueSchema>;
    /**
     * NEW
     * How does an issue propagate inside a component
     */
    intraComponentRules: IntraComponentPropagationRule[];
    /**
     * How does an issue propagate over relations
     */
    interComponentRules: InterComponentPropagationRule[];
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
     * If null, the user needs to enter a title
     */
    title: string | true | null;
    /**
     * NEW
     * Templated fields, for each entry
     * If true, use the value of the source issue
     * If null, the user needs to enter a value
     * If an object, use the value inside it
     */
    templatedFields: Record<string, { value: any } | true>;
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

/**
 * NEW
 * Allows to more flexibly combine filters
 */
export type MetaFilter<T> =
    | T
    | {
          and: MetaFilter<T>[];
      }
    | {
          or: MetaFilter<T>[];
      }
    | {
          not: MetaFilter<T>;
      };

/**
 * Base class for Intra/InterComponentPropagationRule
 */
export interface PropagationRule {
    /**
     * This rule only applies to the following issues
     */
    filterIssue: MetaFilter<IssueFilter>;
}

export interface InterComponentPropagationRule extends PropagationRule {
    /**
     * This rule only applies to the following relations
     */
    filterRelation: MetaFilter<RelationFilter>;
    /**
     * This rule only applies to issues on the following components / interfaces
     */
    filterRelationStart: MetaFilter<RelationPartnerFilter>;
    /**
     * This rule only propagates issues to the following components / interfaces
     */
    filterRelationEnd: MetaFilter<RelationPartnerFilter>;
    /**
     * Should the issue propagate with the relation direction, or against it
     */
    propagationDirection: "forward" | "backward" | "both";
    /**
     * The new issue will be created on the component with the given schema
     */
    newIssueSchema: string;
}

/**
 * NEW
 * Describes how issues propagate inside a component
 */
export type IntraComponentPropagationRule = ComponentInterfacePropagationRule | InterfaceInterfacePropagationRule;

export interface ComponentInterfacePropagationRule extends PropagationRule {
    /**
     * This rule only applies to the following components
     */
    filterComponent: MetaFilter<ComponentFilterBase>;
    /**
     * This rule only applies to the following interfaces
     */
    filterInterface: MetaFilter<InterfaceFilterBase>;
    /**
     * Should the issue propagate from the component to an interface of from an interface to the component
     */
    propagationDirection: "component-interface" | "interface-component" | "both";
}

export interface InterfaceInterfacePropagationRule extends PropagationRule {
    /**
     * This rule only applies to the following intra component dependency specifications
     */
    filterIntraComponentDependencySpecification: MetaFilter<IntraComponentDependencySpecificationFilter>;
    /**
     * This rule only applies to interfaces of the following components
     */
    filterComponent: MetaFilter<ComponentFilterBase>;
    /**
     * This rule only applies to the following interfaces at the start of the dependency
     */
    filterStart: MetaFilter<InterfaceFilterBase>;
    /**
     * This rule only applies to the following interfaces at the end of the dependency
     */
    filterEnd: MetaFilter<InterfaceFilterBase>;
    /**
     * Should the issue propagate with the relation direction, or against it
     */
    propagationDirection: "forward" | "backward" | "both";
}

export interface TemplatedNodeFilter {
    template?: string[];
    /**
     * NEW
     * Filter by templated fields using JSONLogic expressions
     */
    templatedFields?: Record<string, RulesLogic>;
}

export interface IssueFilter extends TemplatedNodeFilter {
    type?: string[];
    state?: string[];
    characteristics?: string[];
}

export interface RelationFilter extends TemplatedNodeFilter {}

export type RelationPartnerFilter = ComponentFilter | InterfaceFilter;

export interface ComponentFilter extends ComponentFilterBase {
    type: "component";
}

export interface ComponentFilterBase extends TemplatedNodeFilter {
    name?: string;
}

/**
 * NEW
 */
export interface InterfaceFilter extends InterfaceFilterBase {
    type: "interface";
    component?: MetaFilter<ComponentFilterBase>;
}

export interface InterfaceFilterBase extends TemplatedNodeFilter {
    name?: string;
}

export interface IntraComponentDependencySpecificationFilter {
    name?: string;
}
