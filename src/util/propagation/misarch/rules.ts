import {
    IntraComponentDependencySpecificationFilter,
    IssueFilter,
    IssuePropagationConfig,
    MetaFilter,
    RelationFilter,
    RelationPartnerFilter
} from "../propagationConfig";
import {
    BUG,
    callsRelationTemplate,
    Characteristics,
    DEPENDS_ON,
    eventRelationTemplate,
    FEATURE,
    frontendTemplate,
    graphQLProvidedInterfaceTemplate,
    graphQLRequiredInterfaceTemplate,
    hostedOnRelationTemplate,
    ICDS_EE,
    ICDS_EG_SD,
    ICDS_GE,
    ICDS_GG,
    includesRelationTemplate,
    infrastructureTemplate,
    libraryTemplate,
    logicalComponentTemplate,
    messagingPublishInterfaceTemplate,
    messagingSubscribeInterfaceTemplate,
    microserviceTemplate,
    oauthProvidedInterfaceTemplate,
    oauthRequiredInterfaceTemplate,
    OPEN,
} from "./templates";

const openBug = {
    template: true,
    type: BUG,
    state: OPEN,
    templatedFields: true
} as const;

const openFeature = {
    template: true,
    type: FEATURE,
    state: OPEN,
    templatedFields: true
} as const;

const dependsOnRelation = {
    relationToSource: {
        type: DEPENDS_ON,
        direction: "outgoing"
    }
} as const;

const openBugFilter: MetaFilter<IssueFilter> = {
    type: [BUG],
    state: [OPEN]
};

const openFeatureFilter: MetaFilter<IssueFilter> = {
    type: [FEATURE],
    state: [OPEN]
};

// #region interface filters

const graphQLRequiredFilter: MetaFilter<RelationPartnerFilter> = {
    type: "interface",
    template: [graphQLRequiredInterfaceTemplate]
};

const oauthRequiredFilter: MetaFilter<RelationPartnerFilter> = {
    type: "interface",
    template: [oauthRequiredInterfaceTemplate]
};

const eventRequiredFilter: MetaFilter<RelationPartnerFilter> = {
    type: "interface",
    template: [messagingSubscribeInterfaceTemplate]
};

const syncRequiredFilter: MetaFilter<RelationPartnerFilter> = {
    or: [graphQLRequiredFilter, oauthRequiredFilter]
};

const graphQLProvidedFilter: MetaFilter<RelationPartnerFilter> = {
    type: "interface",
    template: [graphQLProvidedInterfaceTemplate]
};

const oauthProvidedFilter: MetaFilter<RelationPartnerFilter> = {
    type: "interface",
    template: [oauthProvidedInterfaceTemplate]
};

const eventProvidedFilter: MetaFilter<RelationPartnerFilter> = {
    type: "interface",
    template: [messagingPublishInterfaceTemplate]
};

const syncProvidedFilter: MetaFilter<RelationPartnerFilter> = {
    or: [graphQLProvidedFilter, oauthProvidedFilter]
};

// #endregion

// #region relation filters

const callFilter: MetaFilter<RelationFilter> = {
    template: [callsRelationTemplate]
};

const includesFilter: MetaFilter<RelationFilter> = {
    template: [includesRelationTemplate]
};

const messageSubscriptionFilter: MetaFilter<RelationFilter> = {
    template: [eventRelationTemplate]
};

const hostedOnFilter: MetaFilter<RelationFilter> = {
    template: [hostedOnRelationTemplate]
};

// #endregion

// #region component & interface on component filters

const interfaceOnMicroserviceFilter: MetaFilter<RelationPartnerFilter> = {
    type: "interface",
    component: {
        template: [microserviceTemplate]
    }
};

const interfaceOnFrontendFilter: MetaFilter<RelationPartnerFilter> = {
    type: "interface",
    component: {
        template: [frontendTemplate]
    }
};

const logicalComponentFilter: MetaFilter<RelationPartnerFilter> = {
    type: "component",
    template: logicalComponentTemplate
};

const libraryComponentFilter: MetaFilter<RelationPartnerFilter> = {
    type: "component",
    template: [libraryTemplate]
};

const microserviceComponentFilter: MetaFilter<RelationPartnerFilter> = {
    type: "component",
    template: [microserviceTemplate]
};

const infrastructureComponentFilter: MetaFilter<RelationPartnerFilter> = {
    type: "component",
    template: [infrastructureTemplate]
};

// #endregion

// #region ICDS filters

const icdsGGFilter: MetaFilter<IntraComponentDependencySpecificationFilter> = {
    type: [ICDS_GG]
};

const icdsEEFilter: MetaFilter<IntraComponentDependencySpecificationFilter> = {
    type: [ICDS_EE]
};

const icdsGEFilter: MetaFilter<IntraComponentDependencySpecificationFilter> = {
    type: [ICDS_GE]
};

const icdsEGSDFilter: MetaFilter<IntraComponentDependencySpecificationFilter> = {
    type: [ICDS_EG_SD]
};

// #endregion

// #region partial inter component rules

const microserviceSyncCallFilter = {
    filterRelationStart: {
        and: [interfaceOnMicroserviceFilter, syncRequiredFilter]
    },
    filterRelationEnd: syncProvidedFilter,
    filterRelation: callFilter
};

const frontendSyncCallFilter = {
    filterRelationStart: {
        and: [interfaceOnFrontendFilter, syncRequiredFilter]
    },
    filterRelationEnd: syncProvidedFilter,
    filterRelation: callFilter
};

const logicalComponentSyncCallFilter = {
    filterRelationStart: syncRequiredFilter,
    filterRelationEnd: syncProvidedFilter,
    filterRelation: callFilter
};

const libraryIncludesFilter = {
    filterRelationStart: logicalComponentFilter,
    filterRelationEnd: libraryComponentFilter,
    filterRelation: includesFilter
};

const messagingFilter = {
    filterRelationStart: eventRequiredFilter,
    filterRelationEnd: eventProvidedFilter,
    filterRelation: messageSubscriptionFilter
};

const microserviceHostedOnInfrastructureFilter = {
    filterRelationStart: microserviceComponentFilter,
    filterRelationEnd: infrastructureComponentFilter,
    filterRelation: hostedOnFilter
};

const frontendHostedOnInfrastructureFilter = {
    filterRelationStart: interfaceOnFrontendFilter,
    filterRelationEnd: infrastructureComponentFilter,
    filterRelation: hostedOnFilter
};

// #endregion

// #region partial intra component rules

const microserviceGGFilter = {
    filterComponent: microserviceComponentFilter,
    filterStart: graphQLProvidedFilter,
    filterEnd: graphQLRequiredFilter,
    filterIntraComponentDependencySpecification: icdsGGFilter
};

const microserviceEEFilter = {
    filterComponent: microserviceComponentFilter,
    filterStart: eventRequiredFilter,
    filterEnd: eventProvidedFilter,
    filterIntraComponentDependencySpecification: icdsEEFilter
};

const microserviceGEFilter = {
    filterComponent: microserviceComponentFilter,
    filterStart: graphQLProvidedFilter,
    filterEnd: eventProvidedFilter,
    filterIntraComponentDependencySpecification: icdsGEFilter
};

const microserviceEGSDFilter = {
    filterComponent: microserviceComponentFilter,
    filterStart: eventRequiredFilter,
    filterEnd: graphQLProvidedFilter,
    filterIntraComponentDependencySpecification: icdsEGSDFilter
};

const microserviceToProvidedFilter = {
    propagationDirection: "component-interface" as const,
    filterComponent: microserviceComponentFilter,
    filterInterface: {
        or: [syncProvidedFilter, eventProvidedFilter]
    }
};

const microserviceToProvidedSyncFilter = {
    propagationDirection: "component-interface" as const,
    filterComponent: microserviceComponentFilter,
    filterInterface: syncProvidedFilter
};

const microserviceToRequiredFilter = {
    propagationDirection: "interface-component" as const,
    filterComponent: microserviceComponentFilter,
    filterInterface: {
        or: [syncRequiredFilter, eventRequiredFilter]
    }
};

// #endregion

enum Schemas {
    propagatedAPIBreakingBug = "propagatedAPIBreakingBug",
    propagatedAPIBreakingBugByzantine = "propagatedAPIBreakingBugByzantine",
    frontendCallsAPIBug = "frontendCallsAPIBug",
    libraryVersionUpdateIssue = "libraryVersionUpdateIssue",
    dtoBug = "dtoBug",
    dtoFeature = "dtoFeature",
    serviceUnavailableDueToInfrastructureFail = "serviceUnavailableDueToInfrastructureFail",
    frontendUnvailableDueToInfrastructureFail = "frontendUnvailableDueToInfrastructureFail",
    serviceUnavailableDueToLibraryBreakingChange = "serviceUnavailableDueToLibraryBreakingChange",
    frontendUnvailableDueToLibraryBreakingChange = "frontendUnvailableDueToLibraryBreakingChange",
    callFailedDueToUnavailableService = "serviceUnavailableGeneral",
    propagatedFeatureRequestDownToUp = "propagatedFeatureRequestDownToUp",
    propagatedFeatureRequestUpToDown = "propagatedFeatureRequestUpToDown",
    libBreakingChange = "libBreakingChange",
    apiUsageBug = "dtoParsingBug",
    propagatedMissingEventCall = "propagatedMissingEventCall"
}

export const misarchRules: IssuePropagationConfig = {
    schemas: {
        [Schemas.propagatedAPIBreakingBug]: {
            ...openBug,
            title: "API breaks due to bug in API of upstream component",
            ...dependsOnRelation,
            characteristics: [Characteristics.ApiBreakingBug]
        },
        [Schemas.propagatedAPIBreakingBugByzantine]: {
            ...openBug,
            title: "API breaks due to byzantine bug in API of upstream component",
            ...dependsOnRelation,
            characteristics: [Characteristics.ApiBreakingByzantineBug]
        },
        [Schemas.frontendCallsAPIBug]: {
            ...openBug,
            title: "Frontend calls broken API",
            ...dependsOnRelation,
            characteristics: [Characteristics.FrontendUnavailable]
        },
        [Schemas.libraryVersionUpdateIssue]: {
            template: true,
            type: true,
            state: OPEN,
            title: "Library version update required",
            templatedFields: true,
            ...dependsOnRelation,
            characteristics: [Characteristics.LibraryVersionUpdate]
        },
        [Schemas.dtoBug]: {
            ...openBug,
            title: "Bug in upstream component's DTO",
            ...dependsOnRelation,
            characteristics: [Characteristics.DtoBug]
        },
        [Schemas.dtoFeature]: {
            ...openFeature,
            title: "Change in upstream component's DTO. Update required.",
            ...dependsOnRelation,
            characteristics: [Characteristics.DtoFeature]
        },
        [Schemas.serviceUnavailableDueToInfrastructureFail]: {
            ...openBug,
            title: "Service is unavailable due to infrastructure failure",
            ...dependsOnRelation,
            characteristics: [Characteristics.ServiceUnavailable]
        },
        [Schemas.frontendUnvailableDueToInfrastructureFail]: {
            ...openBug,
            title: "Frontend is unavailable due to infrastructure failure",
            ...dependsOnRelation,
            characteristics: [Characteristics.FrontendUnavailable]
        },
        [Schemas.serviceUnavailableDueToLibraryBreakingChange]: {
            ...openBug,
            title: "Service is unavailable due to a library breaking change",
            ...dependsOnRelation,
            characteristics: [Characteristics.ServiceUnavailable]
        },
        [Schemas.frontendUnvailableDueToLibraryBreakingChange]: {
            ...openBug,
            title: "Frontend is unavailable due to a library breaking change",
            ...dependsOnRelation,
            characteristics: [Characteristics.FrontendUnavailable]
        },
        [Schemas.callFailedDueToUnavailableService]: {
            ...openBug,
            title: "Call to upstream service fails due to unavailability of service",
            ...dependsOnRelation,
            characteristics: [Characteristics.FailingServiceCall]
        },
        [Schemas.propagatedFeatureRequestDownToUp]: {
            ...openFeature,
            title: "Feature request propagated from upstream or downstream component",
            ...dependsOnRelation,
            characteristics: [Characteristics.FeatureRequestDownToUp]
        },
        [Schemas.propagatedFeatureRequestUpToDown]: {
            ...openFeature,
            title: "Feature request propagated from upstream or downstream component",
            ...dependsOnRelation,
            characteristics: [Characteristics.FeatureRequestUpToDown]
        },
        [Schemas.libBreakingChange]: {
            ...openBug,
            title: "Library breaking change",
            ...dependsOnRelation,
            characteristics: [Characteristics.LibraryBreakingChange]
        },
        [Schemas.apiUsageBug]: {
            ...openBug,
            title: "API usage error",
            ...dependsOnRelation,
            characteristics: [Characteristics.APIUsageBug]
        },
        [Schemas.propagatedMissingEventCall]: {
            ...openBug,
            title: "Propagated missing event call",
            ...dependsOnRelation,
            characteristics: [Characteristics.MissingEventCall]
        }
    },
    interComponentRules: [
        // #region API breaking bug
        {
            // microservice calls other microservice
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.ApiBreakingBug]
            },
            ...microserviceSyncCallFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.propagatedAPIBreakingBug
        },
        {
            // frontend calls microservice
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.ApiBreakingBug]
            },
            ...frontendSyncCallFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.frontendCallsAPIBug
        },
        {
            // library includes
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.ApiBreakingBug]
            },
            ...libraryIncludesFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.propagatedAPIBreakingBug
        },
        // #endregion
        // #region API breaking byzantine bug
        {
            // microservice calls other microservice
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.ApiBreakingByzantineBug]
            },
            ...microserviceSyncCallFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.propagatedAPIBreakingBugByzantine
        },
        {
            // frontend calls microservice
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.ApiBreakingByzantineBug]
            },
            ...frontendSyncCallFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.frontendCallsAPIBug // sufficient as not continuing
        },
        {
            // library includes
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.ApiBreakingByzantineBug]
            },
            ...libraryIncludesFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.propagatedAPIBreakingBugByzantine
        },
        {
            // events
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.ApiBreakingByzantineBug]
            },
            ...messagingFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.propagatedAPIBreakingBugByzantine
        },
        // #endregion
        // #region service unavailable
        {
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.ServiceUnavailable]
            },
            ...logicalComponentSyncCallFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.callFailedDueToUnavailableService
        },
        // #endregion
        // #region failing service call
        {
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.FailingServiceCall]
            },
            ...logicalComponentSyncCallFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.callFailedDueToUnavailableService
        },
        // #endregion
        // #region infrastructure failure
        {
            // microservice on infrastructure
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.InfrastructureFailure]
            },
            ...microserviceHostedOnInfrastructureFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.serviceUnavailableDueToInfrastructureFail
        },
        {
            // frontend on infrastructure
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.InfrastructureFailure]
            },
            ...frontendHostedOnInfrastructureFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.frontendUnvailableDueToInfrastructureFail
        },
        // #endregion
        // #region library breaking change
        {
            // microservice
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.LibraryBreakingChange]
            },
            ...microserviceHostedOnInfrastructureFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.serviceUnavailableDueToLibraryBreakingChange
        },
        {
            // frontend
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.LibraryBreakingChange]
            },
            ...frontendHostedOnInfrastructureFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.frontendUnvailableDueToLibraryBreakingChange
        },
        // #endregion
        // #region library version update
        {
            // microservice or frontend
            filterIssue: {
                state: [OPEN],
                characteristics: [Characteristics.LibraryVersionUpdate]
            },
            ...libraryIncludesFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.libraryVersionUpdateIssue
        },
        // #endregion
        // #region missing event call
        {
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.MissingEventCall]
            },
            ...messagingFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.propagatedMissingEventCall
        },
        // #endregion
        // #region feature request - up to down
        {
            // sync call
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.FeatureRequestUpToDown]
            },
            ...logicalComponentSyncCallFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.propagatedFeatureRequestUpToDown
        },
        {
            // event
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.FeatureRequestUpToDown]
            },
            ...microserviceSyncCallFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.propagatedFeatureRequestUpToDown
        },
        // #endregion
        // #region feature request - down to up
        {
            // sync call
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.FeatureRequestDownToUp]
            },
            ...logicalComponentSyncCallFilter,
            propagationDirection: "forward",
            newIssueSchema: Schemas.propagatedFeatureRequestDownToUp
        },
        {
            // event
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.FeatureRequestDownToUp]
            },
            ...microserviceSyncCallFilter,
            propagationDirection: "forward",
            newIssueSchema: Schemas.propagatedFeatureRequestDownToUp
        },
        // #endregion
        // #region dto feature
        {
            // sync call
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.DtoFeature]
            },
            ...logicalComponentSyncCallFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.dtoFeature
        },
        {
            // event
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.DtoFeature]
            },
            ...microserviceSyncCallFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.dtoFeature
        },
        // #endregion
        // #region feature request - up to down
        {
            // sync call
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.DtoBug]
            },
            ...logicalComponentSyncCallFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.dtoBug
        },
        {
            // event
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.DtoBug]
            },
            ...microserviceSyncCallFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.dtoBug
        },
        // #endregion
        // #region api usage bug
        {
            // missing event call due to api usage bug propagated via EE
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.APIUsageBug]
            },
            ...messagingFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.propagatedMissingEventCall
        },
        {
            // API breaking bug due to api usage bug propagated via GG
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.APIUsageBug]
            },
            ...microserviceSyncCallFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.propagatedAPIBreakingBug
        },
        {
            // same for frontend
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.APIUsageBug]
            },
            ...frontendSyncCallFilter,
            propagationDirection: "backward",
            newIssueSchema: Schemas.frontendCallsAPIBug
        }
        // #endregion
    ],
    intraComponentRules: [
        // #region API breaking bug
        {
            // GG in microservice
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.ApiBreakingBug]
            },
            propagationDirection: "backward",
            ...microserviceGGFilter
        },
        {
            // microservice to "outgoing" interfaces
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.ApiBreakingBug]
            },
            ...microserviceToProvidedSyncFilter
        },
        // #endregion
        // #region API breaking byzantine bug
        {
            // GG in microservice
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.ApiBreakingByzantineBug]
            },
            propagationDirection: "backward",
            ...microserviceGGFilter
        },
        {
            // EE in microservice
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.ApiBreakingByzantineBug]
            },
            propagationDirection: "forward",
            ...microserviceEEFilter
        },
        {
            // GE in microservice
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.ApiBreakingByzantineBug]
            },
            propagationDirection: "forward",
            ...microserviceGEFilter
        },
        {
            // EG_SD in microservice
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.ApiBreakingByzantineBug]
            },
            propagationDirection: "forward",
            ...microserviceEGSDFilter
        },
        {
            // microservice to "outgoing" interfaces
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.ApiBreakingByzantineBug]
            },
            ...microserviceToProvidedFilter
        },
        // #endregion
        // #region service unavailable
        {
            // microservice to outgoing sync interfaces
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.ServiceUnavailable]
            },
            ...microserviceToProvidedSyncFilter
        },
        // #endregion
        // #region failing service call
        {
            // microservice to outgoing sync interfaces
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.FailingServiceCall]
            },
            ...microserviceToProvidedSyncFilter
        },
        // #endregion
        // #region missing event call
        {
            // microservice EE
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.MissingEventCall]
            },
            propagationDirection: "forward",
            ...microserviceEEFilter
        },
        // #endregion
        // #region feature request - up to down
        {
            // GG
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.FeatureRequestUpToDown]
            },
            propagationDirection: "backward",
            ...microserviceGGFilter
        },
        {
            // EE
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.FeatureRequestUpToDown]
            },
            propagationDirection: "forward",
            ...microserviceEEFilter
        },
        {
            // GE
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.FeatureRequestUpToDown]
            },
            propagationDirection: "forward",
            ...microserviceGEFilter
        },
        {
            // EG_SD
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.FeatureRequestUpToDown]
            },
            propagationDirection: "forward",
            ...microserviceEGSDFilter
        },
        {
            // microservice to "outgoing" interfaces
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.FeatureRequestUpToDown]
            },
            ...microserviceToProvidedFilter
        },
        // #endregion
        // #region feature request - down to up
        {
            // GG
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.FeatureRequestDownToUp]
            },
            propagationDirection: "forward",
            ...microserviceGGFilter
        },
        {
            // EE
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.FeatureRequestDownToUp]
            },
            propagationDirection: "backward",
            ...microserviceEEFilter
        },
        {
            // GE
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.FeatureRequestDownToUp]
            },
            propagationDirection: "backward",
            ...microserviceGEFilter
        },
        {
            // EG_SD
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.FeatureRequestDownToUp]
            },
            propagationDirection: "backward",
            ...microserviceEGSDFilter
        },
        {
            // microservice to "incoming" interfaces
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.FeatureRequestUpToDown]
            },
            ...microserviceToRequiredFilter
        },
        // #endregion
        // #region dto feature
        {
            // GG
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.DtoFeature]
            },
            propagationDirection: "backward",
            ...microserviceGGFilter
        },
        {
            // EE
            filterIssue: {
                ...openFeatureFilter,
                characteristics: [Characteristics.DtoFeature]
            },
            propagationDirection: "forward",
            ...microserviceEEFilter
        },
        // #endregion
        // #region dto bug
        {
            // GG
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.DtoBug]
            },
            propagationDirection: "backward",
            ...microserviceGGFilter
        },
        {
            // EE
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.DtoBug]
            },
            propagationDirection: "forward",
            ...microserviceEEFilter
        },
        // #endregion
        // #region api usage bug
        {
            // EE
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.APIUsageBug]
            },
            propagationDirection: "forward",
            ...microserviceEEFilter
        },
        {
            // GG
            filterIssue: {
                ...openBugFilter,
                characteristics: [Characteristics.APIUsageBug]
            },
            propagationDirection: "backward",
            ...microserviceGGFilter
        }
        // #endregion
    ]
};
