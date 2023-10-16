# Service for Vehicle Makes and Types Data

This Express.js service efficiently manages the retrieval and storage of vehicle makes and types data from external APIs by using Node.js, MongoDB, Docker, GraphQL, Toad Scheduler and XML2JSON parser. Here are some key points to keep in mind:

- To accommodate the delayed nature of the second API call that includes sending 11k requests (to prevent getting blocked 5req/second is sent) and saving their responses, a scheduled function periodically updates the data. When you access the `/api/v1/makes` endpoint, it retrieves information from the database. Keep in mind that, during the initial load, some makes may initially have empty arrays until the entire dataset is fully loaded. Alternatively, you can opt for a blocking approach, which guarantees that data retrieval is finished before responding to requests.

- The MongoDB port is not exposed to prevent external access to the database, enhancing security.

- Furthermore, the option to incorporate versioning and timestamps into the data for future reference is available.

This service seamlessly handles the complexities of data retrieval, storage, and access, ensuring a reliable and secure experience.
## Prerequisites

Before you proceed, make sure you have the following prerequisites in place:

- Docker and Docker Compose installed for running the Service and MongoDB container.

## Running the Project

To run the project, follow these steps:

1. Clone the project repository.

2. Navigate to the project directory.

    ```bash
    cd service
    ```

3. Start the project using Docker Compose:

    ```bash
    docker compose up
    ```

   This command will create and start containers for both the Express.js service and MongoDB.

4. The service will be running on port 3000.

## Accessing API Endpoints

You can access the following API endpoints:

- **Retrieve Data:** [http://localhost:3000/api/v1/makes](http://localhost:3000/api/v1/makes)
- **GraphQL:** [http://localhost:3000/graphql](http://localhost:3000/graphql)

I hope you find reading the code enjoyable.