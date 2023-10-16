/**
 * Converts an array of objects into a map, using a specified key as the map's keys.
 *
 * @param {Object[]} array - The input array of objects.
 * @param {string} key - The key within each object to be used as the map's key.
 * @returns {Object} - A map with keys based on the specified 'key' and values as the original objects.
 */
export function arrayToMap(array, key) {
    const map = {};
    array.forEach(item => {
        map[item?.[key]] = item;
    });
    return map;
}

/**
 * Converts a map into an array of values.
 *
 * @param {Object} mapObject - The input map.
 * @returns {Object[]} - An array containing the values from the input map.
 */
export function mapToArray(mapObject) {
    return Object.values(mapObject);
}

/**
 * Shuffles an array randomly.
 *
 * @param {Array} array - The input array to be shuffled.
 * @returns {Array} - A new array with the elements randomly shuffled.
 */
export function shuffle(array) {
    let currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex > 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }

    return array;
}

/**
 * A simple logger that logs messages to the console. It can be customized to use other logging systems.
 */
export const logger = console;
