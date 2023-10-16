import express from 'express';
import MakeDataLoader from "./src/entities/makeDataLoader.js";
import {AsyncTask, SimpleIntervalJob, ToadScheduler} from 'toad-scheduler'
import {logger} from "./src/utils/helpers.js";
import {graphqlHTTP} from "express-graphql";
import {schema} from "./src/schemas/vehicleMake.js";

const app = express()
const port = 3000 // later can be changed to 80

/**
 * Handles GET requests to '/api/v1/makes', returning a list of vehicle makes.
 * @param {express.Request} req - The Express.js request object.
 * @param {express.Response} res - The Express.js response object.
 * @returns {Promise<void>} - Resolves with JSON data of vehicle makes.
 */
app.get('/api/v1/makes', async (req, res) => {
    const makes = await MakeDataLoader?.getAllMakes()
    res.json(makes)
})

/**
 * Handles GraphQL requests at '/graphql', using the specified schema and enabling the GraphiQL interface.
 */
app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true,
}));


/**
 * Performs scheduled tasks before starting the application, including data loading and tests.
 * @returns {Promise<ToadScheduler>} - Resolves with the ToadScheduler instance.
 */
async function doBeforeStart() {
    const scheduler = new ToadScheduler()
    const taskId = "LOAD_MAKES_TASK"
    const scheduledFunction = async () => {
        await MakeDataLoader.startLoading()

        // in this case, I relied on just a function to test,
        // but according to the platform and CI/CD pipelines,
        // we can use other approaches (or maybe an external
        // service) for periodic tests.
        await MakeDataLoader.testTheMakesDataTransform() // Run tests
    }
    const task = new AsyncTask(
        taskId, scheduledFunction,
        (err) => {
            logger.log("Error on scheduled function:", err)
        }
    )
    const job = new SimpleIntervalJob({hours: 6}, task, {
        id: taskId,
        preventOverrun: true, // run after the finish of the previous task
    })
    scheduler.addSimpleIntervalJob(job)
    // runs the task immediately after running the service
    // to populate the database
    task.execute()
    return scheduler
}

/**
 * Initiates the application and sets up the Express.js server.
 * @param {ToadScheduler} scheduler - The ToadScheduler instance for scheduled tasks.
 */
doBeforeStart().then((scheduler) => {

    const server = app.listen(port, () => {
        logger.log(`Example app listening on port ${port}`)
    })

    process.on('SIGINT', gracefulShutdown)
    process.on('SIGTERM', gracefulShutdown)

    function gracefulShutdown(error) {
        logger.log("Server Closed...")
        scheduler.stop()
        server.close()
        process.exit(error ? 1 : 0)
    }

});