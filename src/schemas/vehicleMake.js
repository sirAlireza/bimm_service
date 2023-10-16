import { GraphQLList, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import MakeDataLoader from "../entities/makeDataLoader.js";

/**
 * Represents a GraphQL object type for a VehicleType.
 * @type {GraphQLObjectType}
 */
const VehicleType = new GraphQLObjectType({
    name: 'VehicleType',
    fields: {
        typeId: { type: GraphQLString },
        typeName: { type: GraphQLString },
    }
});

/**
 * Represents a GraphQL object type for a VehicleMake.
 * @type {GraphQLObjectType}
 */
const MakeType = new GraphQLObjectType({
    name: 'Make',
    fields: {
        makeId: { type: GraphQLString },
        makeName: { type: GraphQLString },
        vehicleTypes: { type: new GraphQLList(VehicleType) },
    }
});

/**
 * Represents the GraphQL schema for the application, defining the available queries.
 * @type {GraphQLSchema}
 */
export const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'Query',
        fields: {
            makes: {
                type: new GraphQLList(MakeType),
                /**
                 * Resolves the 'makes' query, fetching a list of vehicle makes.
                 * @returns {Promise<MakeType[]>} - Resolves with an array of MakeType objects.
                 */
                resolve: async () => await MakeDataLoader.getAllMakes(),
            },
        },
    }),
});
