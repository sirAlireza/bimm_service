import {MongoClient} from 'mongodb';
import {MONGODB_URI} from "../utils/constants.js";

/**
 * MongoDBFacade provides methods for interacting with a MongoDB database.
 * @class
 */
export default class MongoDBFacade {
    /**
     * Creates a new MongoDBFacade instance.
     * @constructor
     * @param {string} [dbUrl=MONGODB_URI] - The MongoDB connection URL.
     */
    constructor(dbUrl = MONGODB_URI) {
        this.dbUrl = dbUrl;
        this.client = null;
        this.db = null;
    }

    /**
     * Connects to the MongoDB database.
     * @async
     */
    async connect() {
        try {
            this.client = await MongoClient.connect(this.dbUrl);
            this.db = this.client.db("bimm_service");
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
        }
    }

    /**
     * Inserts a single document into the specified collection.
     * @async
     * @param {string} collectionName - The name of the collection.
     * @param {object} document - The document to insert.
     * @returns {object|null} - The inserted document or null if an error occurs.
     */
    async insertOne(collectionName, document) {
        try {
            const collection = this.db.collection(collectionName);
            const result = await collection.insertOne(document);
            return result.ops[0];
        } catch (error) {
            console.error('Error inserting document:', error);
            return null;
        }
    }

    /**
     * Inserts multiple documents into the specified collection.
     * @async
     * @param {string} collectionName - The name of the collection.
     * @param {object[]} documents - The documents to insert.
     * @returns {object[]} - The inserted documents.
     */
    async insertMany(collectionName, documents) {
        try {
            const collection = this.db.collection(collectionName);
            const result = await collection.insertMany(documents);
            return result.ops;
        } catch (error) {
            console.error('Error inserting multiple documents:', error);
            return [];
        }
    }

    /**
     * Inserts or updates a document in the specified collection based on a filter.
     * @async
     * @param {string} collectionName - The name of the collection.
     * @param {object} filter - The filter criteria.
     * @param {object} document - The document to insert or update.
     * @returns {object|null} - The inserted or updated document or null if an error occurs.
     */
    async insertOrUpdate(collectionName, filter, document) {
        try {
            const collection = this.db.collection(collectionName);
            const result = await collection.updateOne(filter, {$set: document}, {upsert: true});
            if (result.upsertedId) {
                const insertedDoc = await collection.findOne({_id: result.upsertedId});
                return insertedDoc;
            }
            return document;
        } catch (error) {
            console.error('Error inserting or updating document:', error);
            return null;
        }
    }

    /**
     * Inserts or updates multiple documents in the specified collection based on a filter key.
     * @async
     * @param {string} collectionName - The name of the collection.
     * @param {string} filterKey - The key to use for the filter.
     * @param {object[]} documents - The documents to insert or update.
     * @returns {object[]} - The inserted or updated documents.
     */
    async insertOrUpdateMany(collectionName, filterKey, documents) {
        try {
            const collection = this.db.collection(collectionName);
            const bulkOps = documents.map(document => ({
                updateOne: {
                    filter: {[filterKey]: document[filterKey]},
                    update: {$set: document},
                    upsert: true,
                },
            }));
            await collection.bulkWrite(bulkOps);
            return documents;
        } catch (error) {
            console.error('Error inserting or updating multiple documents:', error);
            return [];
        }
    }

    /**
     * Finds documents in the specified collection based on a query.
     * @async
     * @param {string} collectionName - The name of the collection.
     * @param {object} query - The query criteria.
     * @returns {object[]} - An array of matching documents.
     */
    async find(collectionName, query) {
        try {
            const collection = this.db.collection(collectionName);
            return await collection.find(query).toArray();
        } catch (error) {
            console.error('Error finding documents:', error);
            return [];
        }
    }

    /**
     * Updates a single document in the specified collection based on a filter.
     * @async
     * @param {string} collectionName - The name of the collection.
     * @param {object} filter - The filter criteria.
     * @param {object} update - The update operation.
     * @returns {boolean} - True if the document is updated, false otherwise.
     */
    async updateOne(collectionName, filter, update) {
        try {
            const collection = this.db.collection(collectionName);
            const result = await collection.updateOne(filter, update);
            return result.modifiedCount > 0;
        } catch (error) {
            console.error('Error updating document:', error);
            return false;
        }
    }

    /**
     * Deletes a single document in the specified collection based on a filter.
     * @async
     * @param {string} collectionName - The name of the collection.
     * @param {object} filter - The filter criteria.
     * @returns {boolean} - True if the document is deleted, false otherwise.
     */
    async deleteOne(collectionName, filter) {
        try {
            const collection = this.db.collection(collectionName);
            const result = await collection.deleteOne(filter);
            return result.deletedCount > 0;
        } catch (error) {
            console.error('Error deleting document:', error);
            return false;
        }
    }

    /**
     * Deletes all documents in the specified collection, effectively truncating it.
     * @async
     * @param {string} collectionName - The name of the collection.
     * @returns {number} - The count of deleted documents.
     */
    async truncateCollection(collectionName) {
        try {
            const collection = this.db.collection(collectionName);
            const deleteResult = await collection.deleteMany({});
            return deleteResult.deletedCount;
        } catch (error) {
            console.error('Error truncating collection:', error);
            return 0;
        }
    }

    /**
     * Closes the MongoDB connection.
     * @async
     */
    async close() {
        if (this.client) {
            await this.client.close();
            console.log('Closed MongoDB connection');
        }
    }
}

