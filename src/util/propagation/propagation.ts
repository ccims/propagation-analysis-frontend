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

interface Relations {
    incoming: Relation[];
    outgoing: Relation[];
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
    private readonly relationLookup = new Map<string, Relation>();
    private readonly relationPartnerRelationsLookup = new Map<string, Relations>();
    private refCounter: number;

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
            this.relationPartnerRelationsLookup.set(component.id, { incoming: [], outgoing: [] });
            for (const inter of component.interfaces) {
                this.interfaceLookup.set(inter.id, inter);
                this.relationPartnerRelationsLookup.set(inter.id, { incoming: [], outgoing: [] });
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
    }

    propagateIssues(): { issues: PropagatedIssue[]; propagatingRelations: Set<string> } {
        const newPropagatedIssues = this.context.issues
            .filter((issue) => typeof issue.id === "string")
            .map((issue) => ({
                ...issue,
                propagations: [...issue.propagations],
                characteristics: [...issue.characteristics]
            }));
        const issuesToPropagate = newPropagatedIssues.flatMap((issue) =>
            issue.componentsAndInterfaces.map((componentId) => ({ issue, componentId }))
        );

        const propagatedIssuesByComponent = new Map<string, PropagatedIssue[]>();
        for (const issue of newPropagatedIssues) {
            for (const componentId of issue.componentsAndInterfaces) {
                if (propagatedIssuesByComponent.has(componentId)) {
                    propagatedIssuesByComponent.get(componentId)!.push(issue);
                } else {
                    propagatedIssuesByComponent.set(componentId, [issue]);
                }
            }
        }

        function propagateIssue(issue: PropagatedIssue, component: Component, rule: PropagationRule) {
            const newIssueSchema = rule.newIssueSchema;

            const schema = config.schemas[newIssueSchema];

            const state = schema.state === true ? issue.state : schema.state!;
            const type = schema.type === true ? issue.type : schema.type!;
            const template = schema.template === true ? issue.template : schema.template!;

            const issuesOnComponent = propagatedIssuesByComponent.get(component.id) ?? [];
            if (issuesOnComponent.some((existingIssue) => existingIssue.propagations.includes(issue.ref))) {
                return;
            }
            const existingIssue = issuesOnComponent.find(
                (existingIssue) =>
                    existingIssue.state === state && existingIssue.type === type && existingIssue.template === template
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
                    ref: refCounter++,
                    propagations: [issue.ref],
                    title: schema.title === true ? issue.title : schema.title,
                    state,
                    type,
                    template,
                    componentsAndInterfaces: [component.id],
                    characteristics: [...schema.characteristics]
                };

                if (propagatedIssuesByComponent.has(component.id)) {
                    propagatedIssuesByComponent.get(component.id)!.push(newIssue);
                } else {
                    propagatedIssuesByComponent.set(component.id, [newIssue]);
                }
                newPropagatedIssues.push(newIssue);
                issuesToPropagate.push({ issue: newIssue, componentId: component.id });
            }
        }
        const propagatingRelations = new Set<string>();
        while (issuesToPropagate.length > 0) {
            const { issue, componentId } = issuesToPropagate.pop()!;
            const component = componentLookup.get(componentId);
            const relations = componentRelationLookup.get(componentId);
            if (relations == undefined) {
                console.log(componentId);
            }
            config.rules.forEach((rule) => {
                for (const outgoingRelation of relations!.outgoing) {
                    const relatedComponent = componentLookup.get(outgoingRelation.to);
                    if (doesIssuePropagate(issue, rule, component!, relatedComponent!, outgoingRelation, true)) {
                        propagatingRelations.add(outgoingRelation.id);
                        propagateIssue(issue, relatedComponent!, rule);
                    }
                }
                for (const incomingRelation of relations!.incoming) {
                    const relatedComponent = componentLookup.get(incomingRelation.from);
                    if (doesIssuePropagate(issue, rule, relatedComponent!, component!, incomingRelation, false)) {
                        propagatingRelations.add(incomingRelation.id);
                        propagateIssue(issue, relatedComponent!, rule);
                    }
                }
            });
        }
        return { issues: newPropagatedIssues, propagatingRelations };
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

    private doesIssuePropagateIntraInterfaceInterface(
        issue: PropagatedIssue,
        rule: InterfaceInterfacePropagationRule,
        component: Component,
        start: Interface,
        end: Interface,
        intraComponentDependencySpecification: IntraComponentDependencySpecification,
        isOutgoing: boolean
    ): boolean {
        if (rule.propagationDirection != "both" && (rule.propagationDirection === "forward") != isOutgoing) {
            return false;
        }

        if (!this.matchesMetaFilter(rule.filterIssue, this.doesIssueMatchFilter.bind(this), issue)) {
            return false;
        }
        if (!this.matchesMetaFilter(rule.filterStart, this.doesMatchBaseFilter.bind(this), start)) {
            return false;
        }
        if (!this.matchesMetaFilter(rule.filterEnd, this.doesMatchBaseFilter.bind(this), end)) {
            return false;
        }
        if (!this.matchesMetaFilter(rule.filterComponent, this.doesMatchBaseFilter.bind(this), component)) {
            return false;
        }
        if (
            !this.matchesMetaFilter(
                rule.filterIntraComponentDependencySpecification,
                this.doesIntraComponentDependencySpecificationMatchFilter.bind(this),
                intraComponentDependencySpecification
            )
        ) {
            return false;
        }

        return true;
    }

    private doesIssuePropagateIntraComponentInterface(
        issue: PropagatedIssue,
        rule: ComponentInterfacePropagationRule,
        component: Component,
        inter: Interface,
        fromComponent: boolean
    ): boolean {
        if (rule.propagationDirection != "both" && (rule.propagationDirection === "component-interface") != fromComponent) {
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
            return false;
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
            return false;
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
