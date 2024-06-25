import { ComponentEnum } from "./componentEnum";
import { ValidationIssue } from "./scoreCalculation";

export const defaultValidationIssues: ValidationIssue[] = [
    {
        description: 'Bug in GraphQL library for Rust introduces breaking changes',
        type: 'Bug',
        state: 'Open',
        initialCharacteristics: ['API breaking bug'],
        initialComponent: ComponentEnum.RUSTGraphQLLibrary,
        propagation: [ComponentEnum.Order, ComponentEnum.Invoice, ComponentEnum.Review, ComponentEnum.Wishlist, ComponentEnum.ShoppingCart, ComponentEnum.Gateway, ComponentEnum.Frontend]
    },
    {
        description: 'Bug in GraphQL library for Kotlin introduces breaking changes',
        type: 'Bug',
        state: 'Open',
        initialCharacteristics: ['API breaking bug'],
        initialComponent: ComponentEnum.KotlinGraphQLLibrary,
        propagation: [ComponentEnum.Return, ComponentEnum.Discount, ComponentEnum.Notification, ComponentEnum.Tax, ComponentEnum.User, ComponentEnum.Catalog, ComponentEnum.Address, ComponentEnum.Gateway, ComponentEnum.Frontend]
    },
    {
        description: 'New version with breaking changes. Update required',
        type: 'Feature',
        state: 'Open',
        initialCharacteristics: ['Library version update'],
        initialComponent: ComponentEnum.keycloakJS,
        propagation: [ComponentEnum.Frontend]
    },
    {
        description: 'New version with breaking changes. Update required',
        type: 'Feature',
        state: 'Open',
        initialCharacteristics: ['Library version update'],
        initialComponent: ComponentEnum.KotlinGraphQLLibrary,
        propagation: [ComponentEnum.Return, ComponentEnum.Discount, ComponentEnum.Notification, ComponentEnum.Tax, ComponentEnum.User, ComponentEnum.Catalog, ComponentEnum.Address]
    },
    {
        description: 'Security related problem with GraphQL Rust GraphQL library.',
        type: 'Bug',
        state: 'Open',
        initialCharacteristics: ['Library version update'],
        initialComponent: ComponentEnum.RUSTGraphQLLibrary,
        propagation: [ComponentEnum.Order, ComponentEnum.Invoice, ComponentEnum.Review, ComponentEnum.Wishlist, ComponentEnum.ShoppingCart]
    },
    {
        description: 'Typo in OrderDTO field. Rename orderIteems to orderItems.',
        type: 'Bug',
        state: 'Open',
        initialCharacteristics: ['DTO bug'],
        initialComponent: ComponentEnum.Order,
        propagation: [ComponentEnum.Inventory, ComponentEnum.Discount, ComponentEnum.Invoice, ComponentEnum.Shipment, ComponentEnum.Return, ComponentEnum.Payment] // all after frontend may not be covered by rule. Update rule to both direction?
    },
    {
        description: 'Notifications should be sent for Wishlist items that obtain a specific Discount in order to inform the user.',
        type: 'Feature',
        state: 'Open',
        initialCharacteristics: ['Feature request - upstream to downstream'],
        initialComponent: ComponentEnum.Wishlist,
        propagation: [ComponentEnum.Discount]
    },
    {
        description: 'Product Variant Versions should get a popularity field, that describes a weighted sum of how much the Product Variant Version is sold recently.',
        type: 'Feature',
        state: 'Open',
        initialCharacteristics: ['Feature request - upstream to downstream'],
        initialComponent: ComponentEnum.Inventory,
        propagation: [ComponentEnum.Gateway, ComponentEnum.Frontend] // Add Order and Shopping Cart?
    },
    {
        description: 'The invoice service does not send out its event for invoice creations /invoice/invoice/created',
        type: 'Bug',
        state: 'Open',
        initialCharacteristics: ['Missing event call'],
        initialComponent: ComponentEnum.Invoice,
        propagation: [ComponentEnum.Payment, ComponentEnum.Shipment]
    },
    {
        description: 'Domain model of bounded context Discount inaccurate, has to be modified',
        type: 'Bug',
        state: 'Open',
        initialCharacteristics: ['Domain model change'],
        initialComponent: ComponentEnum.Discount,
        propagation: [ComponentEnum.Gateway, ComponentEnum.Frontend] // Perhaps all services would fit better?
    },
    {
        description: 'Pods regularly crash in current K8 setup.',
        type: 'Bug',
        state: 'Open',
        initialCharacteristics: ['Infrastructure failure'],
        initialComponent: ComponentEnum.Infrastructure,
        propagation: [ComponentEnum.Frontend, ComponentEnum.Gateway, ComponentEnum.Shipment, ComponentEnum.Payment, ComponentEnum.Discount, ComponentEnum.Return, ComponentEnum.Invoice, ComponentEnum.Order, ComponentEnum.Wishlist, ComponentEnum.Notification, ComponentEnum.Review, ComponentEnum.Tax, ComponentEnum.Inventory, ComponentEnum.ShoppingCart, ComponentEnum.Catalog, ComponentEnum.User, ComponentEnum.Address, ComponentEnum.Keycloak]
    },
    {
        description: 'Add items to shopping cart without logging in. The Frontend should cache the shopping cart of a user that has yet to log in in the user session (of the browser) and send the shopping cart information as a batch to the Shopping Cart service once the user has logged in.',
        type: 'Feature',
        state: 'Open',
        initialCharacteristics: ['Feature request - downstream to upstream'],
        initialComponent: ComponentEnum.Frontend,
        propagation: [ComponentEnum.Gateway, ComponentEnum.ShoppingCart]
    },
    {
        description: 'Catalog service crashes.',
        type: 'Bug',
        state: 'Open',
        initialCharacteristics: ['Service unavailable'],
        initialComponent: ComponentEnum.Catalog,
        propagation: [ComponentEnum.Gateway, ComponentEnum.Frontend] // Perhaps specific ones fit better? Especially Keycloak, user, payment, etc. do not fit well.
    },
    {
        description: 'Introduction of subcategories / hierarchies between categories. Originally, the domain model did not allow categories to relate to one another. Categories would coexist independently. Now, the model must be modified because categories should be able to have subcategories.',
        type: 'Feature',
        state: 'Open',
        initialCharacteristics: ['Domain model change'],
        initialComponent: ComponentEnum.Catalog,
        propagation: [ComponentEnum.Gateway, ComponentEnum.Frontend, ComponentEnum.Discount]
    },
    {
        description: 'DTO validation fails for date.',
        type: 'Bug',
        state: 'Open',
        initialCharacteristics: ['DTO bug'],
        initialComponent: ComponentEnum.Inventory,
        propagation: [ComponentEnum.Discount, ComponentEnum.Shipment, ComponentEnum.Payment, ComponentEnum.Gateway, ComponentEnum.Frontend, ComponentEnum.Order, ComponentEnum.Invoice]
    },
    {
        description: 'Auth error in endpoint',
        type: 'Bug',
        state: 'Open',
        initialCharacteristics: ['API breaking bug'],
        initialComponent: ComponentEnum.Order,
        propagation: [ComponentEnum.Gateway, ComponentEnum.Frontend]
    },
    {
        description: 'Service crashes due to amount of logs',
        type: 'Bug',
        state: 'Open',
        initialCharacteristics: ['Service unavailable'],
        initialComponent: ComponentEnum.Order,
        propagation: [ComponentEnum.Gateway, ComponentEnum.Frontend]
    },
    {
        description: 'Service has long start up time, leadung to unavailability in the first seconds',
        type: 'Bug',
        state: 'Open',
        initialCharacteristics: ['Service unavailable'],
        initialComponent: ComponentEnum.Catalog,
        propagation: [ComponentEnum.Gateway, ComponentEnum.Frontend]
    },
    {
        description: 'Missing Dependancy Tags break services. I.e. mongo:latest is used in package.json and mongo introduces breaking changes regarding transactions or replications that render all Nest.JS services useless.',
        type: 'Bug',
        state: 'Open',
        initialCharacteristics: ['Library breaking change'],
        initialComponent: ComponentEnum.mongNestJSLibrary,
        propagation: [ComponentEnum.Inventory, ComponentEnum.Payment, ComponentEnum.Discount, ComponentEnum.Order, ComponentEnum.Invoice, ComponentEnum.Shipment]
    },
    {
        description: 'Add stripe as payment provider',
        type: 'Feature',
        state: 'Open',
        initialCharacteristics: ['Feature request - upstream to downstream'],
        initialComponent: ComponentEnum.Payment,
        propagation: [ComponentEnum.Gateway, ComponentEnum.Frontend, ComponentEnum.Order]
    },
    {
        description: 'Add new field to product GraphQL DTO',
        type: 'Feature',
        state: 'Open',
        initialCharacteristics: ['DTO feature'],
        initialComponent: ComponentEnum.Catalog,
        propagation: [ComponentEnum.Frontend, ComponentEnum.Gateway]
    }
]

export function mapComponentToId(component: ComponentEnum): string {
    switch (component) {
        case ComponentEnum.Frontend:
            return "9d12d6ac-e85a-407c-bdff-a8321fb75d3a";
        case ComponentEnum.Gateway:
            return "476344ba-61ec-4719-9073-8763b7413820";
        case ComponentEnum.Shipment:
            return "b004efba-b36f-40c2-9b49-4e4eed850335";
        case ComponentEnum.Payment:
            return "e069c868-c07f-4b9c-b2d7-ad6bb2257caf";
        case ComponentEnum.Discount:
            return "3b3bb60b-d0b1-488b-871b-30e3982bb00f";
        case ComponentEnum.Return:
            return "3368f25d-95cc-4640-a640-79a7f6ba7a03";
        case ComponentEnum.Invoice:
            return "18bab628-7093-48d2-9db5-c9cd53c560f9";
        case ComponentEnum.Order:
            return "b42870e5-9824-4c5a-9ea2-d1196fc0d740";
        case ComponentEnum.Wishlist:
            return "3aa1d41c-cdb3-48c7-81c6-dcd4a0dcc59d";
        case ComponentEnum.Notification:
            return "8423c5e9-5335-450c-99b1-de9e9709af60";
        case ComponentEnum.Review:
            return "cfb4d01b-c0fb-4813-89b7-fcf8f25c02f8";
        case ComponentEnum.Tax:
            return "30a21215-1734-4622-a937-0cee6e4a7379";
        case ComponentEnum.Inventory:
            return "ba383e91-738a-488f-baf4-4b5d8876bd74";
        case ComponentEnum.ShoppingCart:
            return "6fce3fcc-4ebd-4c13-b396-64501324918d";
        case ComponentEnum.Catalog:
            return "79d21092-749a-481a-bacf-30a34f870fee";
        case ComponentEnum.User:
            return "84a1d6d7-f601-4d7b-9d6a-c959a184f90a";
        case ComponentEnum.Address:
            return "a2f7b186-1a97-4c31-823c-4c2e936e5a8e";
        case ComponentEnum.Keycloak:
            return "9de999cf-58cd-4b47-aa0e-860cd2b6869c";
        case ComponentEnum.RUSTGraphQLLibrary:
            return "61ef1dc1-1776-4241-be80-450b18abfc0c";
        case ComponentEnum.KotlinGraphQLLibrary:
            return "9c8162a7-50d8-4eea-bf5a-aab7ca42501a";
        case ComponentEnum.NodeJsGraphQLLibrary:
            return "628e4157-bb46-4105-a36b-463073eb35ab";
        case ComponentEnum.keycloakJS:
            return "12a374cc-fada-4e24-b698-783e807d6aaa";
        case ComponentEnum.Infrastructure:
            return "2571e2de-a0e7-4017-b721-2fd3692ad5d6";
        case ComponentEnum.mongNestJSLibrary:
            return "0832f6f7-fb93-4c23-b983-6055876c1b43";
        default:
            throw component + " fucking does not exist"
    }
}
