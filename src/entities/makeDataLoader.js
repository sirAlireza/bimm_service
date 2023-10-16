import axios from "axios";
import xml2js from "xml2js";
import {VehicleMake, VehicleType} from "../models/vehicleMake.js";
import {arrayToMap, logger, mapToArray, shuffle} from "../utils/helpers.js";
import MongoDBFacade from "../db/mongo.js";

const CONCURRENT_REQUESTS = 5
const SLEEP_SECONDS = 1
const TEST_REQUESTS = -1 // -1 to load all vehicle types
const DB_COLLECTION_NAME = "vehicle_makes"

/**
 * Provides methods to load, process, and save vehicle make and type data.
 * @class
 */
export default class MakeDataLoader {

    /**
     * Starts the process of loading, saving, and processing vehicle make and type data.
     * @async
     * @returns {VehicleMake[]} - An array of vehicle make and type data.
     */
    static async startLoading() {
        const allMakes = await this._loadAllMakes()
        logger.log(`${allMakes?.length} makes retrieved, saving to db...`)
        await this._saveMakes(allMakes)
        logger.log("Makes data successfully saved to db...")
        logger.log("Reading and saving vehicle types...")
        // read types and save them into the db
        return await this._loadAndSaveVehicleTypes(allMakes)
    }

    /**
     * Loads all vehicle makes data from an external API.
     * @async
     * @returns {VehicleMake} - Parsed JSON response from the API.
     */
    static async _loadAllMakes() {
        const jsonResponse = await this._readMakesFromAPI()
        logger.log("All makes data read successfully.")
        return this._extractMakeObjects(jsonResponse?.Response)
    }

    /**
     * Reads vehicle makes data from an external API.
     * @async
     * @returns {object} - Parsed XML response from the API.
     */
    static async _readMakesFromAPI() {
        logger.log("Reading all make data...")
        const url = "https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=XML"
        const response = await axios.get(url, {
            headers: {
                // prevent getting blocked by firewall
                'User-Agent': `bla-bla-bla-${Math.random()}`
            }
        })
        return await this._xml2Json(response?.data)
    }

    /**
     * Loads and saves vehicle types for all makes.
     * @async
     * @param {object[]} allMakes - An array of vehicle makes.
     * @returns {VehicleMake[]} - An array of updated vehicle make and type data.
     */
    static async _loadAndSaveVehicleTypes(allMakes = []) {
        const makesMap = arrayToMap(allMakes, "makeId")
        let i = 0
        let promises = []

        // Shuffling the array to prevent starting each time from the same makes
        for (const make of shuffle([...allMakes])) {
            // save make into db
            const readAndSave = async () => {
                try {
                    const vehicleTypes = await this._readVehicleTypesFromAPI(make.makeId)
                    const updatedMake = {...makesMap?.[make.makeId], vehicleTypes}
                    makesMap[make.makeId] = updatedMake
                    await this._saveVehicleTypes(updatedMake)
                    logger.log("Types for make id", make?.makeId, "saved to the db.")
                } catch (e) {
                    logger.log("Error occurred while processing make id", make?.makeId, ", Error:", e)
                }
            }
            promises.push(readAndSave())

            if (promises.length > CONCURRENT_REQUESTS) {
                await Promise.all(promises)
                promises = []
                // sleep to respect the API rate limit
                await new Promise(r => setTimeout(r, SLEEP_SECONDS));
            }
            if (i++ === TEST_REQUESTS) break
        }
        logger.log("All vehicle types read and saved.")
        return mapToArray(makesMap)
    }

    /**
     * Reads vehicle types for a specific make from an external API.
     * @async
     * @param {string} makeId - The ID of the vehicle make.
     * @returns {VehicleType[]} - An array of vehicle type data.
     */
    static async _readVehicleTypesFromAPI(makeId = "") {
        logger.log("Reading vehicle types for make id:", makeId)
        const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMakeId/${makeId}?format=xml`
        const response = await axios.get(url, {
            headers: {
                // prevent getting blocked by firewall
                'User-Agent': `bla-bla-bla-${Math.random()}`
            }
        });
        const jsonResponse = await this._xml2Json(response?.data)
        logger.log("Vehicle types for make id", makeId, "read successfully.")
        return this._extractVehicleTypeObjects(jsonResponse)
    }

    /**
     * Extracts vehicle make objects from a JSON response.
     * @param {object} jsObject - Parsed JSON response.
     * @returns {VehicleMake[]} - An array of vehicle make objects.
     */
    static _extractMakeObjects(jsObject) {
        return jsObject?.Results?.AllVehicleMakes?.map(make => new VehicleMake(make?.Make_ID, make?.Make_Name))
    }

    /**
     * Extracts vehicle type objects from a JSON response.
     * @param {object} jsObject - Parsed JSON response.
     * @returns {VehicleType[]} - An array of vehicle type objects.
     */
    static _extractVehicleTypeObjects(jsObject) {
        // because of xml conversion if there is only one child,
        // it won't return an array or empty array(if it's empty)
        if (jsObject?.Response?.Count == 0) return []
        if (jsObject?.Response?.Count == 1) {
            const onlyVehicleType = jsObject?.Response?.Results?.VehicleTypesForMakeIds
            return [new VehicleType(onlyVehicleType?.VehicleTypeId, onlyVehicleType?.VehicleTypeName)]
        }
        return jsObject?.Response?.Results?.VehicleTypesForMakeIds?.map(
            vehicleType => new VehicleType(vehicleType?.VehicleTypeId, vehicleType?.VehicleTypeName))
    }

    /**
     * Converts XML to JSON with specified options.
     * @async
     * @param {string} xml - XML data to be converted.
     * @param {object} [options={}] - Options for XML to JSON conversion.
     * @returns {object} - Parsed JSON data.
     */
    static async _xml2Json(xml, options = {}) {
        const _options = {
            ignoreAttrs: true,
            normalize: true,
            parseNumbers: true,
            parseBooleans: true,
            trim: true,
            explicitArray: false,
            ...options
        };
        const result = await new Promise((resolve, reject) => {
            xml2js.parseString(xml, _options, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        return result
    }

    /**
     * Saves vehicle make data to the database.
     * @async
     * @param {VehicleMake[]} remoteMakes - An array of vehicle makes.
     * @returns {object[]} - An array of saved vehicle make data.
     */
    static async _saveMakes(remoteMakes) {
        // the versioning logic and timestamps can be implemented
        const db = new MongoDBFacade()
        await db?.connect()
        const dbMakes = await db.find(DB_COLLECTION_NAME)

        // creating maps to have search time in O(1)
        const remoteMakesMap = arrayToMap(remoteMakes, "makeId")
        const dbMakesMap = arrayToMap(dbMakes, "makeId")


        // delete old makes which are removed in the new version
        await Promise.all(dbMakes?.map(async make => {
            if (!remoteMakesMap?.[make?.makeId]) await db?.deleteOne(DB_COLLECTION_NAME, {makeId: make.makeId})
        }))

        // prevent changing back to the empty vehicleType (bc on first
        // call the default value is an empty array for vehicleTypes),
        // if the types already retrieved.
        const makesToSave = remoteMakes.map(make => {
            if (dbMakesMap?.[make?.makeId]?.vehicleTypes?.length > 0 && make?.vehicleTypes?.length === 0) {
                delete make?.vehicleTypes
            }
            return make
        })
        const result = await db.insertOrUpdateMany(DB_COLLECTION_NAME, "makeId", makesToSave)
        db?.close()
        logger.log("Makes data saved to the database.")
        return result
    }

    /**
     * Saves vehicle types for a make in the database.
     * @async
     * @param {object} make - Vehicle make data with types.
     * @returns {object} - Saved vehicle make data with types.
     */
    static async _saveVehicleTypes(make) {
        const db = new MongoDBFacade()
        await db?.connect()
        const result = await db.insertOrUpdate(DB_COLLECTION_NAME, {makeId: make.makeId}, make);
        db?.close()
        logger.log("Vehicle types for make id", make.makeId, "saved to the database.")
        return result
    }

    /**
     * Retrieves all vehicle makes from the database.
     * @async
     * @returns {VehicleMake[]} - An array of vehicle makes and types data.
     */
    static async getAllMakes() {
        const db = new MongoDBFacade()
        await db?.connect()
        const data = await db.find(DB_COLLECTION_NAME)
        db?.close()
        logger.log("Result length:", data?.length)
        return data?.map(d => delete d?._id && d) // remove the _id from the data
    }

    /**
     * Tests the transformation of vehicle make data.
     * @async
     */
    static async testTheMakesDataTransform() {
        // simple test to make sure all makes are saved
        const remoteMakesResponse = await this._readMakesFromAPI()
        const makesInDB = await this.getAllMakes()
        if (remoteMakesResponse?.Response?.Count != makesInDB.length)
            logger.error(remoteMakesResponse?.Response?.Count !== makesInDB.length,
                `Test Failed, DB Count: ${makesInDB.length} vs Remote Count: ${remoteMakesResponse?.Response?.Count}`)
        else
            logger.info("Data transform test passed successfully.")
    }
}