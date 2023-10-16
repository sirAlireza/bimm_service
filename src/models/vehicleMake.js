/**
 * Represents a vehicle type with a unique identifier and a name.
 * @class
 */
export class VehicleType {
    /**
     * Creates a new instance of the VehicleType class.
     * @param {string} typeId - The unique identifier for the vehicle type.
     * @param {string} typeName - The name of the vehicle type.
     */
    constructor(typeId = "", typeName = "") {
        /**
         * The unique identifier for the vehicle type.
         * @type {string}
         */
        this.typeId = typeId;

        /**
         * The name of the vehicle type.
         * @type {string}
         */
        this.typeName = typeName;
    }
}

/**
 * Represents a vehicle make with a unique identifier, a name, and an array of associated vehicle types.
 * @class
 */
export class VehicleMake {
    /**
     * Creates a new instance of the VehicleMake class.
     * @param {string} makeId - The unique identifier for the vehicle make.
     * @param {string} makeName - The name of the vehicle make.
     * @param {VehicleType[]} vehicleTypes - An array of associated vehicle types.
     */
    constructor(makeId = "", makeName = "", vehicleTypes = []) {
        /**
         * The unique identifier for the vehicle make.
         * @type {string}
         */
        this.makeId = makeId;

        /**
         * The name of the vehicle make.
         * @type {string}
         */
        this.makeName = makeName;

        /**
         * An array of associated vehicle types.
         * @type {VehicleType[]}
         */
        this.vehicleTypes = vehicleTypes.map(({ typeId, typeName }) =>
            new VehicleType(typeId, typeName)
        );
    }
}
