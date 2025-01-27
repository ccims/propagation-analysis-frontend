import { unref } from "vue";
import {
    Component,
    Interface,
    IntraComponentDependencySpecification,
    PropagatedIssue,
    PropagationContext,
    Relation,
    TemplatedNode
} from "./issueModel";
import {
    ComponentFilter,
    ComponentFilterBase,
    ComponentInterfacePropagationRule,
    InterComponentPropagationRule,
    InterfaceFilterBase,
    InterfaceInterfacePropagationRule,
    IntraComponentDependencySpecificationFilter,
    IssueFilter,
    IssuePropagationConfig,
    MetaFilter,
    PropagationRule,
    RelationFilter,
    RelationPartnerFilter,
    TemplatedNodeFilter
} from "./propagationConfig";
import { apply } from "json-logic-js";
import deepEqual from "deep-equal";

interface Relations {
    incoming: Relation[];
    outgoing: Relation[];
}

interface IntraComponentDependencies {
    incoming: IntraComponentDependencySpecification[];
    outgoing: IntraComponentDependencySpecification[];
}

export function propagateIssues(
    context: PropagationContext,
    config: IssuePropagationConfig
): { issues: PropagatedIssue[]; propagatingRelations: Set<string> } {
    const propagator = new IssuePropagator(context, config);
    return propagator.propagateIssues();
}

class IssuePropagator {
    private readonly componentLookup = new Map<string, Component>();
    private readonly interfaceLookup = new Map<string, Interface>();
    private readonly relationPartnerLookup = new Map<string, Component | Interface>();
    private readonly relationLookup = new Map<string, Relation>();
    private readonly relationPartnerRelationsLookup = new Map<string, Relations>();
    private readonly intraComponentDependenciesLookup = new Map<string, IntraComponentDependencies>();
    /**
     * Counter for numerical ids
     */
    private refCounter: number;
    private propagatedIssuesByComponent = new Map<string, Set<PropagatedIssue>>();
    /**
     * The resulting propagated issues to return
     */
    private readonly propagatedIssues: PropagatedIssue[] = [];
    /**
     * Unhandled propagations
     */
    private readonly issuesToPropagate: { issue: PropagatedIssue; nodeId: string }[] = [];

    constructor(
        private readonly context: PropagationContext,
        private readonly config: IssuePropagationConfig
    ) {
        this.refCounter =
            Math.max(
                -1,
                ...context.issues.filter((issue) => typeof issue.ref === "number").map((issue) => issue.ref as number)
            ) + 1;

        for (const component of context.components) {
            this.componentLookup.set(component.id, component);
            this.relationPartnerLookup.set(component.id, component);
            this.relationPartnerRelationsLookup.set(component.id, { incoming: [], outgoing: [] });
            for (const inter of component.interfaces) {
                this.interfaceLookup.set(inter.id, inter);
                this.relationPartnerLookup.set(inter.id, inter);
                this.relationPartnerRelationsLookup.set(inter.id, { incoming: [], outgoing: [] });
                this.intraComponentDependenciesLookup.set(inter.id, { incoming: [], outgoing: [] });
            }
        }

        for (const relation of context.relations) {
            this.relationLookup.set(relation.id, relation);
            if (this.relationPartnerRelationsLookup.has(relation.from)) {
                this.relationPartnerRelationsLookup.get(relation.from)!.outgoing.push(relation);
            }
            if (this.relationPartnerRelationsLookup.has(relation.to)) {
                this.relationPartnerRelationsLookup.get(relation.to)!.incoming.push(relation);
            }
        }

        for (const component of context.components) {
            for (const dependency of component.intraComponentDependencySpecifications) {
                for (const outgoing of dependency.outgoing) {
                    this.intraComponentDependenciesLookup.get(outgoing)!.outgoing.push(dependency);
                }
                for (const incoming of dependency.incoming) {
                    this.intraComponentDependenciesLookup.get(incoming)!.incoming.push(dependency);
                }
            }
        }

        this.propagatedIssues = this.context.issues
            .filter((issue) => typeof issue.id === "string")
            .map((issue) => ({
                ...issue,
                propagations: [...issue.propagations],
                characteristics: [...issue.characteristics]
            }));

        for (const issue of this.propagatedIssues) {
            for (const nodeId of issue.componentsAndInterfaces) {
                this.addIssueToComponentOrInterface(issue, nodeId);
            }
        }

        this.issuesToPropagate = this.propagatedIssues.flatMap((issue) =>
            issue.componentsAndInterfaces.map((nodeId) => ({ issue, nodeId }))
        );
    }

    propagateIssues(): { issues: PropagatedIssue[]; propagatingRelations: Set<string> } {
        const propagatingRelations = new Set<string>();
        while (this.issuesToPropagate.length > 0) {
            const { issue, nodeId } = this.issuesToPropagate.pop()!;
            const node = this.relationPartnerLookup.get(nodeId)!;
            const relations = this.relationPartnerRelationsLookup.get(nodeId);
            this.config.interComponentRules.forEach((rule) => {
                for (const outgoingRelation of relations!.outgoing) {
                    const related = this.relationPartnerLookup.get(outgoingRelation.to);
                    if (this.doesIssuePropagateInter(issue, rule, node, related!, outgoingRelation, true)) {
                        propagatingRelations.add(outgoingRelation.id);
                        this.propagateIssueInter(issue, related!, rule);
                    }
                }
                for (const incomingRelation of relations!.incoming) {
                    const related = this.relationPartnerLookup.get(incomingRelation.from);
                    if (this.doesIssuePropagateInter(issue, rule, related!, node, incomingRelation, false)) {
                        propagatingRelations.add(incomingRelation.id);
                        this.propagateIssueInter(issue, related!, rule);
                    }
                }
            });
            this.config.intraComponentRules.forEach((rule) => {
                if ("filterStart" in rule) {
                    if ("component" in node) {
                        const component = this.componentLookup.get(node.component)!;
                        const dependencies = this.intraComponentDependenciesLookup.get(node.id)!;
                        for (const outgoing of dependencies.outgoing) {
                            for (const propagatedTo of this.getPropagatedToInterfaces(
                                issue,
                                rule,
                                component,
                                node,
                                outgoing,
                                true
                            )) {
                                this.propagateIssueIntra(issue, propagatedTo);
                            }
                        }
                        for (const incoming of dependencies.incoming) {
                            for (const propagatedTo of this.getPropagatedToInterfaces(
                                issue,
                                rule,
                                component,
                                node,
                                incoming,
                                false
                            )) {
                                this.propagateIssueIntra(issue, propagatedTo);
                            }
                        }
                    }
                } else {
                    if ("component" in node) {
                        const component = this.componentLookup.get(node.component)!;
                        if (this.doesIssuePropagateIntraComponentInterface(issue, rule, component, node, false)) {
                            this.propagateIssueIntra(issue, node);
                        }
                    } else {
                        for (const inter of node.interfaces) {
                            if (this.doesIssuePropagateIntraComponentInterface(issue, rule, node, inter, true)) {
                                this.propagateIssueIntra(issue, inter);
                            }
                        }
                    }
                }
            });
        }
        return { issues: this.propagatedIssues, propagatingRelations };
    }

    private propagateIssueInter(
        issue: PropagatedIssue,
        node: Component | Interface,
        rule: InterComponentPropagationRule
    ) {
        const newIssueSchema = rule.newIssueSchema;

        const schema = this.config.schemas[newIssueSchema];

        const state = schema.state === true ? issue.state : schema.state!;
        const type = schema.type === true ? issue.type : schema.type!;
        const template = schema.template === true ? issue.template : schema.template!;
        const templatedFields = schema.templatedFields === true ? issue.templatedFields : Object.fromEntries(
            Object.entries(schema.templatedFields).map(([field, value]) =>
                value === true ? [field, issue.templatedFields[field]] : [field, value.value]
            )
        )

        const componentId = "component" in node ? node.component : node.id;

        const issuesOnComponent = this.propagatedIssuesByComponent.get(componentId) ?? [];
        if ([...issuesOnComponent].some((existingIssue) => existingIssue.propagations.includes(issue.ref))) {
            return;
        }
        const existingIssue = [...issuesOnComponent].find(
            (existingIssue) =>
                existingIssue.state === state &&
                existingIssue.type === type &&
                existingIssue.template === template &&
                deepEqual(existingIssue.templatedFields, templatedFields)
        );
        if (existingIssue) {
            existingIssue.propagations.push(issue.ref);
            for (const characteristic of schema.characteristics) {
                if (!existingIssue.characteristics.includes(characteristic)) {
                    existingIssue.characteristics.push(characteristic);
                }
            }
        } else {
            const newIssue: PropagatedIssue = {
                ref: this.refCounter++,
                propagations: [issue.ref],
                title: (schema.title === true ? issue.title : schema.title) ?? undefined,
                state,
                type,
                template,
                componentsAndInterfaces: [node.id],
                characteristics: [...schema.characteristics],
                templatedFields
            };

            this.addIssueToComponentOrInterface(newIssue, componentId);
            this.propagatedIssues.push(newIssue);
            this.issuesToPropagate.push({ issue: newIssue, nodeId: node.id });
        }
    }

    private propagateIssueIntra(issue: PropagatedIssue, node: Component | Interface) {
        if (!issue.componentsAndInterfaces.includes(node.id)) {
            this.addIssueToComponentOrInterface(issue, node.id);
            this.issuesToPropagate.push({ issue, nodeId: node.id });
        }
    }

    private addIssueToComponentOrInterface(issue: PropagatedIssue, componentOrInterface: string) {
        const relationPartner = this.relationPartnerLookup.get(componentOrInterface);
        if (relationPartner == undefined) {
            throw new Error(`Could not find component or interface with id ${componentOrInterface}`);
        }
        const componentId = "component" in relationPartner ? relationPartner.component : relationPartner.id;
        const issuesOnComponent = this.propagatedIssuesByComponent.get(componentId);
        if (issuesOnComponent == undefined) {
            this.propagatedIssuesByComponent.set(componentId, new Set([issue]));
        } else {
            issuesOnComponent.add(issue);
        }
    }

    private doesIssuePropagateInter(
        issue: PropagatedIssue,
        rule: InterComponentPropagationRule,
        start: Component | Interface,
        end: Component | Interface,
        relation: Relation,
        isOutgoing: boolean
    ): boolean {
        if (rule.propagationDirection != "both" && (rule.propagationDirection === "forward") != isOutgoing) {
            return false;
        }

        if (!this.matchesMetaFilter(rule.filterIssue, this.doesIssueMatchFilter.bind(this), issue)) {
            return false;
        }
        if (!this.matchesMetaFilter(rule.filterRelationStart, this.doesRelationPartnerMatchFilter.bind(this), start)) {
            return false;
        }
        if (!this.matchesMetaFilter(rule.filterRelationEnd, this.doesRelationPartnerMatchFilter.bind(this), end)) {
            return false;
        }
        if (!this.matchesMetaFilter(rule.filterRelation, this.doesRelationMatchFilter.bind(this), relation)) {
            return false;
        }

        return true;
    }

    private getPropagatedToInterfaces(
        issue: PropagatedIssue,
        rule: InterfaceInterfacePropagationRule,
        component: Component,
        inter: Interface,
        intraComponentDependencySpecification: IntraComponentDependencySpecification,
        isOutgoing: boolean
    ): Interface[] {
        if (rule.propagationDirection != "both" && (rule.propagationDirection === "forward") != isOutgoing) {
            return [];
        }

        if (!this.matchesMetaFilter(rule.filterIssue, this.doesIssueMatchFilter.bind(this), issue)) {
            return [];
        }
        if (!this.matchesMetaFilter(rule.filterComponent, this.doesMatchBaseFilter.bind(this), component)) {
            return [];
        }
        if (
            !this.matchesMetaFilter(
                rule.filterIntraComponentDependencySpecification,
                this.doesIntraComponentDependencySpecificationMatchFilter.bind(this),
                intraComponentDependencySpecification
            )
        ) {
            return [];
        }
        if (
            !this.matchesMetaFilter(
                isOutgoing ? rule.filterStart : rule.filterEnd,
                this.doesMatchBaseFilter.bind(this),
                inter
            )
        ) {
            return [];
        }
        return intraComponentDependencySpecification[isOutgoing ? "outgoing" : "incoming"]
            .map((id) => this.interfaceLookup.get(id)!)
            .filter((inter) =>
                this.matchesMetaFilter(
                    isOutgoing ? rule.filterEnd : rule.filterStart,
                    this.doesMatchBaseFilter.bind(this),
                    inter
                )
            );
    }

    private doesIssuePropagateIntraComponentInterface(
        issue: PropagatedIssue,
        rule: ComponentInterfacePropagationRule,
        component: Component,
        inter: Interface,
        fromComponent: boolean
    ): boolean {
        if (
            rule.propagationDirection != "both" &&
            (rule.propagationDirection === "component-interface") != fromComponent
        ) {
            return false;
        }

        if (!this.matchesMetaFilter(rule.filterIssue, this.doesIssueMatchFilter.bind(this), issue)) {
            return false;
        }
        if (!this.matchesMetaFilter(rule.filterComponent, this.doesMatchBaseFilter.bind(this), component)) {
            return false;
        }
        if (!this.matchesMetaFilter(rule.filterInterface, this.doesMatchBaseFilter.bind(this), inter)) {
            return false;
        }

        return true;
    }

    private doesIssueMatchFilter(issue: PropagatedIssue, filter: IssueFilter): boolean {
        if (!this.doesTemplatedNodeMatchFilter(issue, filter)) {
            return false;
        }
        if (filter.type != undefined && !filter.type.includes(issue.type)) {
            return false;
        }
        if (filter.state != undefined && !filter.state.includes(issue.state)) {
            return false;
        }
        if (filter.template != undefined && !filter.template.includes(issue.template)) {
            return false;
        }
        if (
            filter.characteristics != undefined &&
            !filter.characteristics.some((characteristic) => issue.characteristics.includes(characteristic))
        ) {
            return false;
        }
        return true;
    }

    private doesIntraComponentDependencySpecificationMatchFilter(
        intraComponentDependencySpecification: IntraComponentDependencySpecification,
        filter: IntraComponentDependencySpecificationFilter
    ): boolean {
        if (filter.name == undefined) {
            return true;
        }
        return intraComponentDependencySpecification.name.match(filter.name) != null;
    }

    private doesRelationMatchFilter(relation: Relation, filter: RelationFilter): boolean {
        return this.doesTemplatedNodeMatchFilter(relation, filter);
    }

    private doesRelationPartnerMatchFilter(node: Component | Interface, filter: RelationPartnerFilter): boolean {
        if (!this.doesMatchBaseFilter(node, filter)) {
            return false;
        }
        if (filter.type == "interface") {
            const inter = node as Interface;
            if (filter.component != undefined) {
                if (
                    !this.matchesMetaFilter(
                        filter.component,
                        this.doesMatchBaseFilter.bind(this),
                        this.componentLookup.get(inter.component)!
                    )
                ) {
                    return false;
                }
            }
        }
        return true;
    }

    private doesMatchBaseFilter(
        node: Component | Interface,
        filter: ComponentFilterBase | InterfaceFilterBase
    ): boolean {
        if (!this.doesTemplatedNodeMatchFilter(node, filter)) {
            return false;
        }
        if (filter.name == undefined) {
            return true;
        }
        return node.name.match(filter.name) != null;
    }

    private doesTemplatedNodeMatchFilter(node: Omit<TemplatedNode, "id">, filter: TemplatedNodeFilter): boolean {
        if (filter.template != undefined && !filter.template.includes(node.template)) {
            return false;
        }
        for (const [field, value] of Object.entries(filter.templatedFields ?? {})) {
            if (!apply(value, node.templatedFields[field])) {
                return false;
            }
        }
        return true;
    }

    private matchesMetaFilter<T extends object, V>(
        filter: MetaFilter<T>,
        matchesFilter: (value: V, filter: T) => boolean,
        value: V
    ): boolean {
        if ("and" in filter) {
            return filter.and.every((subFilter) => this.matchesMetaFilter(subFilter, matchesFilter, value));
        } else if ("or" in filter) {
            return filter.or.some((subFilter) => this.matchesMetaFilter(subFilter, matchesFilter, value));
        } else if ("not" in filter) {
            return !this.matchesMetaFilter(filter.not, matchesFilter, value);
        } else {
            return matchesFilter(value, filter);
        }
    }
}

export function extractCharacteristics(config: IssuePropagationConfig): string[] {
    const characteristics = new Set<string>();
    for (const schema of Object.values(config.schemas)) {
        for (const characteristic of schema.characteristics) {
            characteristics.add(characteristic);
        }
    }
    const issueFilters = [...config.intraComponentRules, ...config.interComponentRules].map((rule) => rule.filterIssue);
    while (issueFilters.length > 0) {
        const filter = issueFilters.pop()!;
        if ("characteristics" in filter) {
            for (const characteristic of filter.characteristics ?? []) {
                characteristics.add(characteristic);
            }
        } else if ("and" in filter) {
            issueFilters.push(...filter.and);
        } else if ("or" in filter) {
            issueFilters.push(...filter.or);
        } else if ("not" in filter) {
            issueFilters.push(filter.not);
        }
    }
    return [...characteristics];
}
